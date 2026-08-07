import { Howl } from 'howler';

// Audio player service
class AudioPlayer {
  private currentSound: Howl | null = null;
  private currentTrackId: string | null = null;
  private currentPlayingTrackUrl: string | null = null; // ✅ NEW: Store the current playing audio URL
  private audioContext: AudioContext | null = null;
  private listeners: Map<string, Function[]> = new Map(); // ✅ NEW: Event listeners map

  constructor() {
    // Don't initialize AudioContext here - wait for user gesture to comply with autoplay policy
    // AudioContext will be created on first play attempt
  }

  // ✅ NEW: Event emitter methods
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback: Function) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)?.filter(cb => cb !== callback);
      this.listeners.set(event, callbacks || []);
    }
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach(callback => callback(...args));
  }

  private async initAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();

        // Resume if suspended (required by browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }
      } catch (error) {
        console.warn('AudioContext not supported:', error);
      }
    }
  }

  private async createDemoTone() {
    try {
      // Initialize AudioContext on first use (after user gesture)
      await this.initAudioContext();

      if (!this.audioContext) {
        // Fallback if Web Audio API not supported
        this.notifyPlayState(true);
        this.currentPlayingTrackUrl = '/demo-tone.mp3'; // ✅ Set dummy URL for demo tone
        setTimeout(() => this.notifyPlayState(false), 800);
        return;
      }

      // Generate a simple beep sound for demo
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4 note
      gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.8);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.8);

      this.notifyPlayState(true);
      this.currentPlayingTrackUrl = '/demo-tone.mp3'; // ✅ Set dummy URL for demo tone
      setTimeout(() => this.notifyPlayState(false), 800);

    } catch (error) {
      console.warn('Failed to create demo tone:', error);
      // Fallback notification
      this.notifyPlayState(true);
      this.currentPlayingTrackUrl = '/demo-tone.mp3'; // ✅ Set dummy URL for demo tone on fallback
      setTimeout(() => this.notifyPlayState(false), 800);
    }
  }

  private playTone(audioContext: AudioContext) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Create a 440Hz beep for 0.8 seconds
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);

    // Notify play state
    this.notifyPlayState(true);
    this.currentPlayingTrackUrl = '/demo-tone.mp3'; // ✅ Set dummy URL for demo tone
    setTimeout(() => this.notifyPlayState(false), 850);
  }

  play(trackId: string, audioUrl?: string) {
    // Stop current playback
    this.stop();

    // Validate URL before playing
    if (!audioUrl || (!audioUrl.startsWith("http") && !audioUrl.startsWith("data:"))) {
      console.error("Invalid audio URL:", audioUrl);
      // Fallback to demo tone if URL is invalid
      this.createDemoTone();
      this.currentTrackId = trackId;
      // currentPlayingTrackUrl will be set by createDemoTone
      this.notifyPlayState(true);

      // Auto-stop after demo duration
      setTimeout(() => {
        this.currentTrackId = null;
        this.currentPlayingTrackUrl = null; // ✅ Clear URL on demo tone stop
        this.notifyPlayState(false);
      }, 800);
      return;
    }

    const isWav = audioUrl.includes('.wav') || audioUrl.includes('audio/wav')
    const format = isWav ? ['wav'] : ['mp3']

    // Direct public URL - validation already done above
    this.currentSound = new Howl({
      src: [audioUrl], // Direct public URL
      html5: !audioUrl.startsWith('data:'), // HTML5 streaming for remote URLs, Web Audio for data URIs
      format,
      volume: 0.7,
      onplay: () => {
        this.currentTrackId = trackId;
        this.currentPlayingTrackUrl = audioUrl; // ✅ Store the currently playing URL
        this.notifyPlayState(true);
        this.currentSound?.on('seek', () => this.emit('timeUpdate', this.currentSound?.seek() || 0, this.currentSound?.duration() || 0)); // Emit on seek
        this.currentSound?.on('fade', () => this.emit('timeUpdate', this.currentSound?.seek() || 0, this.currentSound?.duration() || 0)); // Emit on fade (can affect time)
        this.currentSound?.on('stop', () => this.emit('timeUpdate', 0, this.currentSound?.duration() || 0)); // Emit 0 on stop
      },
      onend: () => {
        this.currentTrackId = null;
        this.currentPlayingTrackUrl = null; // ✅ Clear URL on end
        this.notifyPlayState(false);
      },
      onstop: () => {
        this.currentTrackId = null;
        this.currentPlayingTrackUrl = null; // ✅ Clear URL on stop
        this.notifyPlayState(false);
      },
      onloaderror: (id, error) => {
        console.error('Audio load error:', error);
        // Fallback to demo tone if audio fails
        this.createDemoTone();
        this.currentTrackId = trackId;
        // currentPlayingTrackUrl will be set by createDemoTone
      },
      onplayerror: (id, error) => {
        console.error('Howler.js Play Error:', error);
        // Fallback to demo tone on play error
        this.createDemoTone();
        this.currentTrackId = trackId;
        // currentPlayingTrackUrl will be set by createDemoTone
      },
      onfade: () => {
        // Optional: handle fade events if needed
      },
      onseek: () => {
        // Optional: handle seek events if needed
      }
    });

    this.currentSound.play();
  }

  pause() {
    if (this.currentSound) {
      this.currentSound.pause();
      this.notifyPlayState(false);
    }
  }

  resume() {
    if (this.currentSound && !this.currentSound.playing()) {
      this.currentSound.play();
      this.notifyPlayState(true);
    }
  }

  stop() {
    if (this.currentSound) {
      this.currentSound.stop();
      this.currentSound = null;
    }
    this.currentTrackId = null;
    this.currentPlayingTrackUrl = null; // ✅ Clear URL on stop
    this.notifyPlayState(false);
  }

  isPlaying(trackId?: string): boolean {
    if (trackId) {
      return this.currentTrackId === trackId;
    }
    return this.currentSound ? this.currentSound.playing() : false;
  }

  getPlayingTrackUrl(): string | null {
    return this.currentPlayingTrackUrl;
  }

  // Public getter for current sound (needed by StickyPlayer component)
  getAudio(): Howl | null {
    return this.currentSound;
  }

  getPlayingTrackId(): string | null {
    return this.currentTrackId;
  }

  getDuration(): number {
    return this.currentSound ? this.currentSound.duration() : 0;
  }

  seek(time: number) {
    this.currentSound?.seek(time);
  }

  private notifyPlayState(isPlaying: boolean) {
    // Dispatch custom event for UI updates (only in browser)
    this.emit('playStateChange', { isPlaying, trackId: this.currentTrackId });
    if (this.currentSound) {
        this.emit('timeUpdate', this.currentSound.seek(), this.currentSound.duration());
    }
  }
}

// Global audio player instance
export const audioPlayer = new AudioPlayer();

// Global functions for components
declare global {
  interface Window {
    playTrackAudio?: (trackId: string, audioUrl?: string) => void;
    pauseTrackAudio?: () => void;
    stopTrackAudio?: () => void;
    isTrackPlaying?: (trackId: string) => boolean;
  }
}

if (typeof window !== 'undefined') {
  // These are now handled by StickyPlayer and custom events
  // window.playTrackAudio = (trackId: string, audioUrl?: string) => audioPlayer.play(trackId, audioUrl);
  // window.pauseTrackAudio = () => audioPlayer.pause();
  // window.stopTrackAudio = () => audioPlayer.stop();
  // window.isTrackPlaying = (trackId: string) => audioPlayer.isPlaying(trackId);
}
