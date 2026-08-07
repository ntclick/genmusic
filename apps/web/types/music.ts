export type MusicGenre = {
  id: string
  name: string
  description: string | null
  prompt_template: string
  icon: string | null
  sort_order: number
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type MusicGeneration = {
  id: string
  user_id: string | null
  prompt: string
  lyrics: string
  genre: string
  duration_seconds: number
  seed: number | null
  title: string | null
  slug: string | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  status: JobStatus
  audio_url: string | null
  artwork_url: string | null
  like_count: number
  dislike_count: number
  audio_size_kb: number | null
  generation_time_ms: number | null
  has_vocals: boolean
  engine: 'musicgen' | 'suno'
  plays: number
  downloads: number
  is_public: boolean
  source: 'user' | 'seed' | 'admin'
  created_at: string
  updated_at: string
}

export type SubscriptionPlan = {
  id: string
  name: string
  price_usd: number
  stripe_price_id: string | null
  generations_per_day: number
  max_duration_seconds: number
  has_vocals: boolean
  has_priority: boolean
  features: string[]
  is_active: boolean
}

export type UserSubscription = {
  id: string
  user_id: string
  plan_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export type GenerateRequest = {
  prompt: string
  lyrics?: string
  genre: string
  duration: number
  seed?: number
  title?: string
}

export type GenerateResponse = {
  job_id: string
  status: 'processing'
}

export type StatusResponse = {
  status: JobStatus
  audio_url?: string
  generation_time_ms?: number
  error?: string
  title?: string
  slug?: string
}

export type QuotaResponse = {
  plan: string
  used: number
  limit: number
  remaining: number
  can_generate: boolean
  has_vocals: boolean
  vocal_limit: number
  vocal_used: number
  vocal_remaining: number
  max_duration: number
}

export type WebhookPayload = {
  job_id: string
  status: 'completed' | 'failed'
  audio_url?: string
  audio_size_kb?: number
  generation_time_ms?: number
  error?: string
}

export type ModalPayload = {
  prompt: string
  lyrics: string
  duration: number
  seed: number
  job_id: string
  webhook_url: string
}
