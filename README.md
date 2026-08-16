# PhoneZoo — AI Ringtone Generator

Generate unique MP3 ringtones in ~60 seconds using MusicGen AI. Describe the sound you want, pick a genre, and download.

**Live demo:**  https://genmusicai.vercel.app/ · **Video:**  https://youtu.be/Sar09y-qEhw

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| GPU backend | Modal.com — MusicGen-Medium (1.5B) on T4 |
| Storage | Shelby testnet (Aptos blockchain) + Cloudflare R2 fallback |
| AI Write | DeepSeek Chat API |

## How It Works

1. User submits prompt + genre → Next.js creates a job in Supabase, fires request to Modal
2. Modal runs MusicGen inference (~30–60s), encodes MP3, uploads to Shelby testnet
3. Modal POSTs result to `/api/webhook` → Supabase job marked `completed`
4. Frontend polls `/api/status/:jobId` every 2–5s, shows audio player when done

## Local Development

```bash
# 1. Install dependencies
cd apps/web && npm install

# 2. Copy env and fill in values
cp .env.example .env.local

# 3. Run dev server
npm run dev
```

Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MODAL_ENDPOINT_URL`, `WEBHOOK_SECRET`, `SHELBY_*`.

## Deploy GPU Backend

```bash
cd services/gpu
pip install modal
modal deploy acestep_api.py
# Copy the generated endpoint URL → MODAL_ENDPOINT_URL in Vercel env vars
```

## Project Structure

```
apps/web/          — Next.js frontend + API routes
services/gpu/      — Modal GPU backend (MusicGen inference)
```
