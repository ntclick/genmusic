# Phonezoo — AI Music Generator on ShelbyNet

Generate original AI music from a text prompt, and make custom ringtones for iPhone/Android. Every generated track is stored on **Shelby** (ShelbyNet, on Aptos) and registered on-chain — there is no centralized storage fallback anywhere in the pipeline.

**Live demo:** [genmusicai.vercel.app](https://genmusicai.vercel.app/) · **Video:** [youtu.be/Sar09y-qEhw](https://youtu.be/Sar09y-qEhw)

---

## Features

- **AI music generator** — prompt + genre + duration; audio rendered by MusicGen on a Modal GPU
- **Decentralized storage** — uploaded to Shelby, registered with an Aptos Move transaction, and **verified readable before the URL is published**
- **On-chain provenance** — each track exposes its direct blob URL and its Aptos transaction
- **Ringtone maker** — trim audio and convert MP3 → M4R entirely client-side (ffmpeg.wasm)
- **Library & discovery** — search and browse by category, likes, reviews, trending feed
- **Admin panel** — manage tracks, genres, users, stats
- **Auth & payments** — Firebase + Supabase, Stripe checkout

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| GPU backend | Modal.com — MusicGen-Medium (1.5B) on T4 |
| Storage | Shelby — ShelbyNet, on Aptos (no centralized fallback) |
| Chain | Aptos (shelbynet, chain_id 118) |
| AI lyrics/prompt writing | DeepSeek Chat API |
| Audio processing | ffmpeg.wasm, Howler.js |

## How storage works

The pipeline treats "stored" as meaning *provably retrievable*, not merely *uploaded*:

1. Audio is generated, then uploaded through the Shelby Node SDK
2. The SDK **registers** the blob on-chain (an Aptos Move transaction) and **commits** it
3. The blob URL is fetched back over HTTP to confirm it actually serves
4. Only then is the URL returned to the client and written to Supabase

If any step fails, the request fails with `502 Shelby storage unavailable`. Nothing is written to the database and no URL is published.

This matters because **a registered-but-uncommitted blob answers HTTP 404**. Skipping the verification step is what previously produced dead audio links.

### Endpoints

`shelbynet` is the only Shelby network — Shelby Testnet has been retired and the SDK throws `Unsupported Shelby network` if given it, so the network is a constant in the code rather than an env var.

| Purpose | URL |
|---|---|
| Blob gateway / RPC | `https://api.shelbynet.shelby.xyz/shelby` |
| Aptos fullnode | `https://api.shelbynet.shelby.xyz/v1` |
| Indexer (GraphQL) | `https://api.shelbynet.shelby.xyz/v1/graphql` |
| Explorer | `https://explorer.shelby.xyz/shelbynet` |

Public blob URL format:

```
https://api.shelbynet.shelby.xyz/shelby/v1/blobs/{account}/{blobName}
```

> ⚠️ **ShelbyNet is a developer prototype and is wiped roughly once a week.** Blobs stored there are not permanent. Do not treat it as durable storage for anything you cannot re-upload.

## Local Development

```bash
cd apps/web && npm install
```

```bash
npm run dev
```

The dev server runs on **port 5050**.

### Required env vars

Create `apps/web/.env.local`:

| Group | Variables |
|---|---|
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| Shelby | `SHELBY_API_KEY`, `SHELBY_PRIVATE_KEY`, `SHELBY_ACCOUNT_ADDRESS`, `NEXT_PUBLIC_SHELBY_ACCOUNT_ADDRESS`, `SHELBY_EXPIRATION_DAYS` |
| Modal | `MODAL_ENDPOINT_URL`, `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`, `WEBHOOK_SECRET` |
| App | `NEXT_PUBLIC_APP_URL` (use `http://localhost:5050` locally) |
| Optional | `DEEPSEEK_API_KEY`, Stripe keys, Firebase config |

`NEXT_PUBLIC_SHELBY_ACCOUNT_ADDRESS` must mirror `SHELBY_ACCOUNT_ADDRESS`: only `NEXT_PUBLIC_*` variables reach the browser, and the client needs the account to build blob URLs.

**About `SHELBY_API_KEY`:** without a valid key the RPC applies a per-IP anonymous rate limit and answers `429` partway through an upload, leaving the blob registered but never committed. Because ShelbyNet is reset frequently, keys go stale — and a stale key fails harder than none (`401 API key not found`). The upload worker therefore probes the key at startup and falls back to anonymous with a warning if it is rejected. Generate a fresh key at [geomi.dev](https://geomi.dev).

## Tooling

Audit what is actually stored on Shelby — lists the account's blobs and checks that every committed one is served over HTTP:

```bash
node test-graphql.mjs
```

Migrate legacy audio still hosted elsewhere onto Shelby (dry run by default; idempotent):

```bash
node migrate-r2-to-shelby.mjs
```

```bash
node migrate-r2-to-shelby.mjs --apply --limit 50
```

## Deploy GPU Backend

```bash
cd services/gpu && modal deploy acestep_api.py
```

Copy the generated endpoint URL into `MODAL_ENDPOINT_URL`. The Modal secret `phonezoo-secrets` must carry `SHELBY_API_KEY`, `SHELBY_PRIVATE_KEY`, `SHELBY_ACCOUNT_ADDRESS`, and `WEBHOOK_SECRET`.

## Project Structure

```
apps/web/
  app/api/generate/        — generate → Shelby upload → verify → persist
  app/api/webhook/         — Modal callback
  app/api/admin/           — tracks, genres, users, stats
  app/api/stripe/          — checkout & webhook
  lib/shelby.ts            — Shelby SDK client, network constants, indexer
  lib/shelby-public.ts     — client-safe blob URL builder
  shelby-upload.mjs        — upload worker (Shelby SDK + on-chain confirmation)
  migrate-r2-to-shelby.mjs — legacy storage migration
services/gpu/              — Modal GPU backend (MusicGen inference)
test-graphql.mjs           — ShelbyNet storage audit
```

## Notes

- `r2_original_key` / `r2_processed_keys` are historical Supabase **column names**. They hold storage keys, not Cloudflare URLs, and resolve against Shelby via `lib/shelby-public.ts`.
- Blob names follow `phonezoo/ringtones/ai-generated/{id}.{wav|mp3}`.
