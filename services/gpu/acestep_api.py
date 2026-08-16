"""
PhoneZoo AI Ringtone Generator — Modal GPU Backend
Deploys MusicGen-Medium (1.5B) on a T4 GPU via Modal.com serverless.

Storage: Shelby decentralized storage (ShelbyNet) — the only backend.
  Upload runs through the Shelby Node SDK so the blob is registered on-chain
  (Aptos Move tx) before its public URL is handed back to the webhook.
  There is no centralized fallback: if Shelby fails, the job fails.

Deploy:
  cd services/gpu
  modal deploy acestep_api.py

Test locally:
  modal run acestep_api.py

After deploy, copy the generated endpoint URL to MODAL_ENDPOINT_URL in .env.local
"""

import modal
import os
import io
import time

# ============================================================
# Container image — built once and cached by Modal
# ============================================================
# Minimal Node.js script that runs inside Modal to upload to Shelby.
# Simpler than the Windows version — Linux DNS works fine, no patches needed.
_SHELBY_UPLOAD_MJS = r"""
import dns from 'dns'
dns.setDefaultResultOrder('ipv4first')

const jobId = process.argv[2]
if (!jobId) { process.stderr.write('Usage: shelby-upload.mjs <jobId>\n'); process.exit(1) }

const rawKey = (process.env.SHELBY_PRIVATE_KEY || '').replace(/^ed25519-priv-/, '')
if (!rawKey) { process.stderr.write('SHELBY_PRIVATE_KEY not set\n'); process.exit(1) }

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const audioBuffer = Buffer.concat(chunks)

// Pre-resolve Shelby hostname via Cloudflare DoH (1.1.1.1 is a literal IP).
// GeoDNS may return different IPs depending on location — pin to a known-working IP.
// shelbynet is the only Shelby network — testnet was retired (SDK throws on it).
const SHELBY_NETWORK = 'shelbynet'
const SHELBY_RPC_BASE = 'https://api.shelbynet.shelby.xyz/shelby'
const shelbyHost = 'api.shelbynet.shelby.xyz'
let shelbyIP = null
try {
  const res = await fetch(
    `https://1.1.1.1/dns-query?name=${encodeURIComponent(shelbyHost)}&type=A`,
    { headers: { Accept: 'application/dns-json' } }
  )
  const data = await res.json()
  shelbyIP = data.Answer?.find(r => r.type === 1)?.data ?? null
  if (shelbyIP) process.stderr.write(`[dns] ${shelbyHost} → ${shelbyIP}\n`)
} catch (e) {
  process.stderr.write(`[dns] DoH failed: ${e.message}\n`)
}

// Patch dns.lookup only for the Shelby hostname — leaves all other DNS untouched
// (Aptos SDK uses different hostnames that resolve fine via OS DNS)
if (shelbyIP) {
  const _nativeLookup = dns.lookup.bind(dns)
  const _ip = shelbyIP, _host = shelbyHost
  dns.lookup = (hostname, options, callback) => {
    if (hostname === _host) {
      const cb = typeof options === 'function' ? options : callback
      const opts = typeof options === 'object' && options !== null ? options : {}
      opts.all ? cb(null, [{ address: _ip, family: 4 }]) : cb(null, _ip, 4)
    } else if (typeof options === 'function') {
      _nativeLookup(hostname, options)
    } else {
      _nativeLookup(hostname, options, callback)
    }
  }
  process.stderr.write(`[dns] lookup patched for ${shelbyHost}\n`)
}

const { Ed25519PrivateKey, Account } = await import('@aptos-labs/ts-sdk')
const { ShelbyNodeClient } = await import('@shelby-protocol/sdk/node')

const privateKey = new Ed25519PrivateKey(rawKey)
const signer = Account.fromPrivateKey({ privateKey })

// A valid API key avoids the per-IP anonymous rate limit (429) that otherwise
// aborts uploads midway. But shelbynet is wiped ~weekly, so keys go stale, and a
// stale key fails harder than none at all (401 "API key not found"). Probe it and
// drop it if rejected — anonymous is slower but still works.
let shelbyApiKey = process.env.SHELBY_API_KEY || undefined
if (shelbyApiKey) {
  try {
    const probe = await fetch('https://api.shelbynet.shelby.xyz/v1', {
      headers: { Authorization: `Bearer ${shelbyApiKey}` },
    })
    if (!probe.ok) {
      process.stderr.write(`[Shelby] SHELBY_API_KEY rejected (HTTP ${probe.status}) — falling back to anonymous\n`)
      shelbyApiKey = undefined
    }
  } catch (e) {
    process.stderr.write(`[Shelby] could not validate SHELBY_API_KEY (${e.message}) — falling back to anonymous\n`)
    shelbyApiKey = undefined
  }
} else {
  process.stderr.write('[Shelby] SHELBY_API_KEY not set — running anonymous (rate limited)\n')
}

const client = new ShelbyNodeClient({
  network: SHELBY_NETWORK,
  ...(shelbyApiKey ? { apiKey: shelbyApiKey } : {}),
})

const blobName = `phonezoo/ringtones/ai-generated/${jobId}.mp3`
const expirationDays = parseInt(process.env.SHELBY_EXPIRATION_DAYS || '30', 10)
const expirationMicros = BigInt(Date.now() + expirationDays * 24 * 60 * 60 * 1000) * 1000n

// Retry up to 3x with 5s delay — Shelby HTTP upload can fail if blockchain
// transaction hasn't propagated to CDN nodes yet (race condition).
let lastErr
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    // locationHint is required: the account has no default write location, and
    // without it the upload is rejected with "No write location could be resolved".
    await client.upload({
      signer,
      blobName,
      blobData: new Uint8Array(audioBuffer),
      expirationMicros,
      options: { locationHint: 'shelbynet-1' },
    })
    lastErr = null
    break
  } catch (e) {
    lastErr = e
    process.stderr.write(`[Shelby] Attempt ${attempt} failed: ${e.message}\n`)
    if (attempt < 3) await new Promise(r => setTimeout(r, 5000))
  }
}
if (lastErr) throw lastErr

const encodedName = blobName.split('/').map(encodeURIComponent).join('/')
const url = `${SHELBY_RPC_BASE}/v1/blobs/${signer.accountAddress}/${encodedName}`

// A blob is only readable once it is committed on-chain. Registering without
// committing leaves a blob that answers 404, so confirm the URL actually serves
// before handing it back — better to fail the job than to publish a dead link.
let verified = false
for (let attempt = 1; attempt <= 5; attempt++) {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) { verified = true; break }
    process.stderr.write(`[Shelby] verify attempt ${attempt}: HTTP ${head.status}\n`)
  } catch (e) {
    process.stderr.write(`[Shelby] verify attempt ${attempt} failed: ${e.message}\n`)
  }
  if (attempt < 5) await new Promise(r => setTimeout(r, 3000))
}
if (!verified) throw new Error(`Blob uploaded but not readable (not committed): ${url}`)

process.stdout.write(JSON.stringify({ url, sizeKb: Math.round(audioBuffer.length / 1024) }))
"""

musicgen_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(["ffmpeg", "curl"])
    .run_commands([
        # Install Node.js 22 via NodeSource
        "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -",
        "apt-get install -y nodejs",
        # Install Shelby + Aptos SDK for Node.js
        "mkdir -p /shelby-worker",
        'echo \'{"type":"module"}\' > /shelby-worker/package.json',
        "cd /shelby-worker && npm install @shelby-protocol/sdk @aptos-labs/ts-sdk",
    ])
    .pip_install([
        "torch==2.6.0",          # 2.6+ required by transformers due to CVE-2025-32434 torch.load fix
        "transformers>=4.40.0",
        "accelerate>=0.28.0",
        "pydub>=0.25.1",
        "requests>=2.31.0",
        "fastapi[standard]>=0.100.0",
    ])
)
# No ace-step, no numpy conflict, no spacy/gradio/numba

# Modal Volume to cache the model weights across cold starts (~3GB)
model_volume = modal.Volume.from_name("phonezoo-model-cache", create_if_missing=True)

app = modal.App("phonezoo-acestep")

# ============================================================
# Model class — loaded once per container, reused across requests
# ============================================================
@app.cls(
    gpu="T4",
    image=musicgen_image,
    secrets=[modal.Secret.from_name("phonezoo-secrets")],
    volumes={"/model-cache": model_volume},
    scaledown_window=120,  # Keep warm for 2 min after last request
    timeout=600,           # 10 min: cold start model download (~3GB first time) + generation
)
class ACEStepGenerator:

    @modal.enter()
    def load_model(self):
        """Load MusicGen-Medium model into GPU memory on container start."""
        import torch
        from transformers import MusicgenForConditionalGeneration, AutoProcessor

        print("[MusicGen] Loading model...")
        start = time.time()

        self.processor = AutoProcessor.from_pretrained(
            "facebook/musicgen-medium",
            cache_dir="/model-cache",
        )
        self.model = MusicgenForConditionalGeneration.from_pretrained(
            "facebook/musicgen-medium",
            cache_dir="/model-cache",
        )
        self.model.to("cuda")
        self.sample_rate = self.model.config.audio_encoder.sampling_rate  # 32000

        elapsed = time.time() - start
        print(f"[MusicGen] Model loaded in {elapsed:.1f}s, sample_rate={self.sample_rate}")

    @modal.method()
    def generate(self, payload: dict) -> dict:
        """
        Run MusicGen inference and upload the result to Shelby (ShelbyNet).
        Returns {status, audio_url, generation_time_ms} on success
        or {status: 'failed', error} on failure.
        """
        import torch
        import numpy as np
        import requests

        job_id = payload["job_id"]
        prompt = payload["prompt"]
        lyrics = payload.get("lyrics", "")
        duration = int(payload.get("duration", 30))
        seed = int(payload.get("seed", 42))
        webhook_url = payload["webhook_url"]

        start_ms = int(time.time() * 1000)

        try:
            # Fold lyrics into prompt if provided
            full_prompt = f"{prompt}. Lyrics theme: {lyrics}" if lyrics else prompt

            print(f"[MusicGen] Generating job {job_id}: prompt='{full_prompt[:80]}', duration={duration}s, seed={seed}")

            # MusicGen generates ~50 tokens/sec at 32kHz
            max_new_tokens = duration * 50  # 15s→750, 30s→1500, 60s→3000

            torch.manual_seed(seed)

            inputs = self.processor(
                text=[full_prompt],
                padding=True,
                return_tensors="pt",
            ).to("cuda")

            with torch.inference_mode():
                audio_values = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=True,
                    guidance_scale=3.0,
                )

            # audio_values: [batch=1, channels=1, samples]
            audio_np = audio_values[0, 0].cpu().numpy()  # shape: (samples,)

            print(f"[MusicGen] Generated {len(audio_np)} samples at {self.sample_rate}Hz ({len(audio_np)/self.sample_rate:.1f}s)")

            # Encode to MP3 via pydub (no soundfile needed)
            from pydub import AudioSegment

            # Normalize to int16
            audio_np = audio_np.squeeze()
            if audio_np.dtype != np.int16:
                audio_np = (audio_np / max(np.abs(audio_np).max(), 1e-8) * 32767).astype(np.int16)

            # Build AudioSegment directly from raw PCM bytes
            audio_segment = AudioSegment(
                audio_np.tobytes(),
                frame_rate=self.sample_rate,
                sample_width=2,   # 16-bit PCM = 2 bytes
                channels=1,
            )

            # Export to MP3 (192kbps)
            mp3_buf = io.BytesIO()
            audio_segment.export(mp3_buf, format="mp3", bitrate="192k")
            mp3_bytes = mp3_buf.getvalue()

            print(f"[MusicGen] Encoded MP3: {len(mp3_bytes) // 1024}KB")

            generation_time_ms = int(time.time() * 1000) - start_ms

            # Shelby is the only storage backend. No fallback: a job that cannot be
            # stored on-chain must fail loudly rather than silently land somewhere else.
            audio_url = _upload_to_shelby_via_node(mp3_bytes, job_id)
            print(f"[MusicGen] Job {job_id} completed in {generation_time_ms}ms → Shelby: {audio_url}")

            _call_webhook(webhook_url, {
                "job_id": job_id,
                "status": "completed",
                "audio_url": audio_url,
                "audio_size_kb": len(mp3_bytes) // 1024,
                "generation_time_ms": generation_time_ms,
            })
            return {"status": "completed", "audio_url": audio_url, "generation_time_ms": generation_time_ms}

        except Exception as exc:
            import traceback
            tb = traceback.format_exc()
            print(f"[MusicGen] Job {job_id} FAILED: {exc}\n{tb}")

            _call_webhook(webhook_url, {
                "job_id": job_id,
                "status": "failed",
                "error": str(exc),
            })

            return {"status": "failed", "error": str(exc)}


# ============================================================
# Web endpoint — responds immediately, spawns background task
# ============================================================
router_image = modal.Image.debian_slim().pip_install("fastapi[standard]>=0.100.0")

@app.function(
    image=router_image,
    secrets=[modal.Secret.from_name("phonezoo-secrets")],
    timeout=30,
)
@modal.fastapi_endpoint(method="POST", label="phonezoo-acestep-generate")
def generate(payload: dict):
    """
    Public HTTP endpoint called by Next.js /api/generate.
    Returns immediately and spawns the GPU generation as a background task.
    """

    # Validate required fields
    required = ["prompt", "job_id", "webhook_url"]
    for field in required:
        if not payload.get(field):
            return {"error": f"Missing required field: {field}"}, 400

    # Spawn GPU generation asynchronously (fire-and-forget from this endpoint's perspective)
    ACEStepGenerator().generate.spawn(payload)

    return {
        "status": "processing",
        "job_id": payload["job_id"],
        "message": "Generation started. You will be notified via webhook when complete.",
    }


# ============================================================
# Storage helpers
# ============================================================

def _upload_to_shelby_via_node(mp3_bytes: bytes, job_id: str) -> str:
    """Upload MP3 to ShelbyNet by running Node.js shelby-upload.mjs inside the Modal container."""
    import subprocess
    import json

    # Verify required env vars are present before spawning Node
    missing = [k for k in ("SHELBY_PRIVATE_KEY", "SHELBY_API_KEY", "SHELBY_ACCOUNT_ADDRESS")
               if not os.environ.get(k)]
    if missing:
        raise RuntimeError(f"Missing Modal secrets: {', '.join(missing)}. Add them to phonezoo-secrets.")

    # Write the upload script to the worker dir (once per container is fine)
    script_path = "/shelby-worker/shelby-upload.mjs"
    if not os.path.exists(script_path):
        with open(script_path, "w") as f:
            f.write(_SHELBY_UPLOAD_MJS)

    result = subprocess.run(
        ["node", "--dns-result-order=ipv4first", script_path, job_id],
        input=mp3_bytes,
        capture_output=True,
        timeout=180,  # 3 min: blockchain registration ~10-30s + upload
        env=dict(os.environ),  # explicitly forward all Modal env vars to subprocess
    )

    stderr = result.stderr.decode(errors="replace")
    if stderr:
        print(f"[Shelby] node stderr: {stderr[:300]}")

    if result.returncode != 0:
        raise RuntimeError(f"shelby-upload.mjs failed (exit {result.returncode}): {stderr[:500]}")

    # SDK notices can land on stdout alongside the result, so pick the last line
    # that parses as JSON rather than assuming stdout is only the payload.
    data = None
    for line in result.stdout.decode(errors="replace").splitlines():
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
            except ValueError:
                pass
    if not data or not data.get("url"):
        raise RuntimeError(f"Bad output from shelby-upload.mjs: {result.stdout.decode(errors='replace')[:500]}")

    return data["url"]


# ============================================================
# Helper
# ============================================================
def _call_webhook(webhook_url: str, payload: dict, max_retries: int = 3):
    """POST the result to the Next.js webhook with retries."""
    import requests

    webhook_secret = os.environ.get("WEBHOOK_SECRET", "")
    headers = {
        "Content-Type": "application/json",
        "x-webhook-secret": webhook_secret,
    }

    for attempt in range(max_retries):
        try:
            resp = requests.post(webhook_url, json=payload, headers=headers, timeout=15)
            resp.raise_for_status()
            print(f"[MusicGen] Webhook delivered (attempt {attempt + 1}): {resp.status_code}")
            return
        except Exception as e:
            print(f"[MusicGen] Webhook attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)

    print(f"[MusicGen] WARNING: All webhook attempts failed for {payload.get('job_id')}")


# ============================================================
# Local testing entry point
# ============================================================
@app.local_entrypoint()
def test():
    """Run a quick local test: modal run services/gpu/acestep_api.py"""
    result = ACEStepGenerator().generate.remote({
        "prompt": "upbeat pop melody with piano, 120 bpm, bright and catchy",
        "lyrics": "",
        "duration": 15,
        "seed": 42,
        "job_id": "test-local-001",
        "webhook_url": "https://httpbin.org/post",  # Echo server for testing
    })
    print("Result:", result)
