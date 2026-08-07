'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, Music, Menu, X, ShieldCheck, Disc } from 'lucide-react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b border-white/10 bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-200">
            <Disc className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1">
              Gen<span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Music</span>
            </span>
            <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 -mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ShelbyNet
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-gray-200 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>AI Studio</span>
          </Link>
        </nav>

        {/* Network Badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ShelbyNet Devnet (Aptos)</span>
          </div>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            className="p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#020617]/98 backdrop-blur-2xl px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5"
          >
            AI Studio & Generator
          </Link>
        </div>
      )}
    </header>
  )
}
