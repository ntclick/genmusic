'use client'

import Link from 'next/link'
import type { Database } from '@/types/supabase'
import { Grid } from 'lucide-react' // Import the Grid icon

type Category = Database['public']['Tables']['categories']['Row']

// Extended category type with computed fields
type CategoryWithStats = Category & {
  dailyDownloads?: number
  // Aliases for backward compatibility
  id?: number
  name?: string
  slug?: string
  icon?: string
}

interface Props {
  categories?: CategoryWithStats[]
}

const defaultCategories: CategoryWithStats[] = [
  {
    category_id: 0,
    category_name: 'Trending Now',
    category_slug: 'trending',
    description: 'Most popular ringtones today',
    icon_emoji: '🔥',
    display_order: 0,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 2100, // Highest downloads - trending category
    created_at: new Date().toISOString()
  },
  {
    category_id: 1,
    category_name: 'iPhone Ringtones',
    category_slug: 'iphone',
    description: 'Ringtones for iPhone',
    icon_emoji: '📱',
    display_order: 1,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 1250,
    created_at: new Date().toISOString()
  },
  {
    category_id: 2,
    category_name: 'Android Ringtones',
    category_slug: 'android',
    description: 'Ringtones for Android',
    icon_emoji: '🤖',
    display_order: 2,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 980,
    created_at: new Date().toISOString()
  },
  {
    category_id: 3,
    category_name: 'SMS & Message Tones',
    category_slug: 'sms',
    description: 'SMS and message tones',
    icon_emoji: '💬',
    display_order: 3,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 750,
    created_at: new Date().toISOString()
  },
  {
    category_id: 4,
    category_name: 'Alarms',
    category_slug: 'alarm',
    description: 'Alarm sounds',
    icon_emoji: '⏰',
    display_order: 4,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 620,
    created_at: new Date().toISOString()
  },
  {
    category_id: 5,
    category_name: 'Funny',
    category_slug: 'funny',
    description: 'Funny sounds',
    icon_emoji: '😂',
    display_order: 5,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 890,
    created_at: new Date().toISOString()
  },
  {
    category_id: 6,
    category_name: 'Gaming FX',
    category_slug: 'game',
    description: 'Gaming sound effects',
    icon_emoji: '🎮',
    display_order: 6,
    is_active: true,
    parent_category_id: null,
    dailyDownloads: 450,
    created_at: new Date().toISOString()
  }
]

export default function CategoryGrid({ categories }: Props) {
  // Map database fields to expected aliases and sort by daily downloads
  const mappedCategories = ((categories as CategoryWithStats[]) || defaultCategories)
    .map(cat => ({
      ...cat,
      id: cat.category_id || cat.id,
      name: cat.category_name || cat.name,
      slug: cat.category_slug || cat.slug,
      icon: cat.icon_emoji || cat.icon
    }))
    .sort((a, b) => (b.dailyDownloads || 0) - (a.dailyDownloads || 0))

  return (
    <section id="categories" className="py-12 bg-brand-dark container mx-auto px-4">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Grid className="w-5 h-5 text-brand-primary" /> { /* Use Lucide React component */ } Popular Categories
      </h2>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {mappedCategories.map((category) => (
          <Link
            key={`${category.id}-${category.slug}`}
            href={`/category/${category.slug}`}
            className="bg-brand-card hover:bg-white/5 border border-white/5 hover:border-brand-primary/50 p-3 rounded-xl text-center group transition"
          >
            <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-brand-primary">
              {category.icon || '🎵'}
            </div>
            <span className="text-xs font-bold text-white">{category.name}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
