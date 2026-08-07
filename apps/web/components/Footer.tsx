'use client'

import Link from 'next/link'
import { Music, Mail, FileText, Shield, Lock, Heart, Cookie } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-bg-panel border-t border-bg-border mt-auto" role="contentinfo" aria-label="Site footer">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label="Phonezoo - Go to homepage">
              <div className="w-8 h-8 bg-brand-orange rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <span className="text-xl font-bold text-white">Phonezoo</span>
            </Link>
            <p className="text-sm text-brand-text mb-4">
              Free online ringtone maker for iPhone and Android. Create custom ringtones from any song in seconds.
            </p>
            <div className="flex items-center gap-2 text-sm text-brand-muted">
              <Heart className="w-4 h-4 text-red-500" aria-hidden="true" />
              <span>Made for music lovers</span>
            </div>
          </div>

          {/* Quick Links */}
          <nav aria-label="Quick links">
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2" role="list">
              <li>
                <Link href="/" className="text-sm text-brand-text hover:text-brand-orange transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/maker" className="text-sm text-brand-text hover:text-brand-orange transition">
                  Ringtone Maker
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-brand-text hover:text-brand-orange transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-brand-text hover:text-brand-orange transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-brand-text hover:text-brand-orange transition">
                  Blog
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal links">
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2" role="list">
              <li>
                <Link href="/terms" className="text-sm text-brand-text hover:text-brand-orange transition flex items-center gap-2">
                  <FileText className="w-3 h-3" aria-hidden="true" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-brand-text hover:text-brand-orange transition flex items-center gap-2">
                  <Lock className="w-3 h-3" aria-hidden="true" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/dmca" className="text-sm text-brand-text hover:text-brand-orange transition flex items-center gap-2">
                  <Shield className="w-3 h-3" aria-hidden="true" />
                  DMCA Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-sm text-brand-text hover:text-brand-orange transition flex items-center gap-2">
                  <Cookie className="w-3 h-3" aria-hidden="true" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2" role="list">
              <li>
                <a 
                  href="mailto:admin@phonezoo.com" 
                  className="text-sm text-brand-text hover:text-brand-orange transition flex items-center gap-2"
                  aria-label="Send email to admin@phonezoo.com"
                >
                  <Mail className="w-3 h-3" aria-hidden="true" />
                  admin@phonezoo.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-bg-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-brand-muted">
            © {currentYear} Phonezoo. All rights reserved.
          </p>
          <nav className="flex items-center gap-6" aria-label="Footer legal links">
            <Link href="/terms" className="text-xs text-brand-muted hover:text-brand-orange transition">
              Terms
            </Link>
            <Link href="/privacy" className="text-xs text-brand-muted hover:text-brand-orange transition">
              Privacy
            </Link>
            <Link href="/dmca" className="text-xs text-brand-muted hover:text-brand-orange transition">
              DMCA
            </Link>
            <Link href="/cookies" className="text-xs text-brand-muted hover:text-brand-orange transition">
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
