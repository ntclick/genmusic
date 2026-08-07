declare global {
  interface Window {
    // Remove global declarations as components now manage state and events
    // playTrack?: (trackData: any) => void;
    // pauseTrack?: () => void;
    // copyToClipboard?: (text: string) => void;
    // playerState?: any;
  }
}

export {};
