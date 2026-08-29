// ============================================================
// FILE 1: Components & UI
// Contains: Components folder + layout.js + globals.css
// Repository: Samsung-xmd by frozenlorddev
// ============================================================


// ============================================================
// FILE: Components/Contributors.js
// ============================================================
'use client';

const contributors = [
  {
    name: 'DOMINIC MOKUA KERUBO',
    role: 'Founder',
    company: 'Mzazi Tech',
    initials: 'DM',
    color: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    glow: 'rgba(37,99,235,0.35)',
    badge: '🚀',
  },
  {
    name: 'ANTONY OCHIENG',
    role: 'Founder',
    company: 'SPOILER-TECH Tech',
    initials: 'AO',
    color: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
    glow: 'rgba(124,58,237,0.35)',
    badge: '⚡',
  },
  {
    name: 'BIG BROTHER',
    role: 'Founder',
    company: 'Darknode XMD',
    initials: 'BB',
    color: 'linear-gradient(135deg, #0f766e, #0d9488)',
    glow: 'rgba(15,118,110,0.35)',
    badge: '🌐',
  },
];

function ContributorCard({ c }) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(22,24,42,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #1e2d4a',
        borderRadius: '20px',
        padding: '36px 28px',
        textAlign: 'center',
        transition: 'transform 0.25s, box-shadow 0.25s, border-color 0.25s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = `0 12px 40px ${c.glow}`;
        e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = '#1e2d4a';
      }}
    >
      {/* Avatar */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: c.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 800, color: '#fff',
          boxShadow: `0 0 28px ${c.glow}`,
          margin: '0 auto',
        }}>
          {c.initials}
        </div>
        <div style={{
          position: 'absolute', bottom: 0, right: -4,
          width: '28px', height: '28px', borderRadius: '50%',
          backgroundColor: '#0a0a0f', border: '2px solid #1e2d4a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px',
        }}>
          {c.badge}
        </div>
      </div>

      <h3 style={{ color: '#f0f4ff', fontWeight: 800, fontSize: '16px', marginBottom: '6px', lineHeight: 1.3 }}>
        {c.name}
      </h3>
      <p style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{c.role}</p>
      <p style={{ color: '#475569', fontSize: '13px' }}>{c.company}</p>
      <div style={{ width: '40px', height: '2px', margin: '16px auto 0', background: c.color, borderRadius: '2px' }} />
    </div>
  );
}

export default function Contributors() {
  return (
    <section className="py-20" style={{ backgroundColor: 'rgba(10,10,15,0.88)', backdropFilter: 'blur(4px)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600 }}>🤝 Project Contributors</span>
          </div>
          <h2 className="text-4xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Built by Visionaries</h2>
          <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
            The founders and innovators who brought this platform to life.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {contributors.map(c => <ContributorCard key={c.name} c={c} />)}
        </div>
      </div>
    </section>
  );
}


// ============================================================
// FILE: Components/Footer.js
// ============================================================
import Link from 'next/link';

const sections = [
  {
    title: 'Services',
    links: [
      { label: 'Pterodactyl Panels', href: '/products' },
      { label: 'WhatsApp Bot',       href: '/whatsapp-bot' },
      { label: 'Wallet Top-up',      href: '/wallet' },
      { label: 'Dashboard',          href: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us',   href: '/about' },
      { label: 'Contact',    href: '/contact' },
      { label: 'Create Account', href: '/signup' },
      { label: 'Login',     href: '/login' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Telegram Support', href: 'https://t.me/mzazitech',      external: true },
      { label: 'WhatsApp',         href: 'https://wa.me/254108595201', external: true },
      { label: 'Telegram Bot',     href: 'https://t.me/mrsmzazixdbot', external: true },
      { label: 'Email Us',         href: 'mailto:mzazitechinc@gmail.com', external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#060810', borderTop: '1px solid #1e2d4a' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" style={{ textDecoration: 'none' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-lg font-extrabold"
                style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MZAZI TECH
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#475569' }}>
              Kenya's trusted provider of Pterodactyl panel hosting, WhatsApp automation bots, and tech solutions.
            </p>
            {/* Social / contact chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Telegram', href: 'https://t.me/mzazitech', icon: '✈️' },
                { label: 'WhatsApp', href: 'https://wa.me/254108595201', icon: '📱' },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{ backgroundColor: '#0f1629', color: '#64748b', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                  {s.icon} {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {sections.map(s => (
            <div key={s.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#3b82f6' }}>{s.title}</p>
              <ul className="space-y-2.5">
                {s.links.map(l => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer"
                        className="text-sm transition-colors hover:text-blue-400"
                        style={{ color: '#64748b', textDecoration: 'none' }}>
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href}
                        className="text-sm transition-colors hover:text-blue-400"
                        style={{ color: '#64748b', textDecoration: 'none' }}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Warranty notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl mb-8"
          style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)' }}>
          <span className="text-lg flex-shrink-0">🛡️</span>
          <p className="text-xs leading-relaxed" style={{ color: '#475569' }}>
            <span className="font-semibold" style={{ color: '#60a5fa' }}>Panel Warranty: </span>
            Pterodactyl panel replacement warranty is valid for <strong style={{ color: '#93c5fd' }}>2 weeks</strong> from purchase. Contact support within this period for a free replacement.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-8"
          style={{ borderTop: '1px solid #1e2d4a' }}>
          <p className="text-xs text-center sm:text-left" style={{ color: '#374151' }}>
            © {new Date().getFullYear()} Mzazi Tech Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { label: 'Privacy', href: '/contact' },
              { label: 'Terms',   href: '/contact' },
              { label: 'Support', href: '/contact' },
            ].map(l => (
              <Link key={l.label} href={l.href}
                className="text-xs transition-colors hover:text-blue-400"
                style={{ color: '#374151', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
            <Link href="/admin/login"
              className="text-xs transition-colors hover:text-red-400"
              style={{ color: '#1f2937', textDecoration: 'none' }}>
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


// ============================================================
// FILE: Components/Navbar.js
// ============================================================
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/',             label: 'Home' },
  { href: '/products',     label: 'Panels' },
  { href: '/whatsapp-bot', label: 'WhatsApp Bot' },
  { href: '/about',        label: 'About' },
  { href: '/contact',      label: 'Contact' },
];

export default function Navbar() {
  const [user, setUser]               = useState(null);
  const [walletBalance, setWallet]    = useState(null);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [chatOpen, setChatOpen]       = useState(false);
  const [chatMsg, setChatMsg]         = useState({ subject: '', message: '' });
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSent, setChatSent]       = useState(false);
  const router   = useRouter();
  const pathname = usePathname();
  const chatRef  = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth check on every route change
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setUser(d.user);
          fetch('/api/wallet/balance')
            .then(r => r.ok ? r.json() : null)
            .then(wd => { if (wd) setWallet(wd.balance); });
        } else {
          setUser(null);
          setWallet(null);
        }
      })
      .catch(() => { setUser(null); setWallet(null); });
  }, [pathname]);

  // Close chat dropdown on outside click
  useEffect(() => {
    const handler = e => { if (chatRef.current && !chatRef.current.contains(e.target)) setChatOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null); setWallet(null); setMenuOpen(false);
    router.push('/');
  };

  const handleChatSubmit = async e => {
    e.preventDefault();
    setChatLoading(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatMsg),
      });
      if (res.ok) { setChatSent(true); setChatMsg({ subject: '', message: '' }); }
    } catch {}
    setChatLoading(false);
  };

  const isActive = href => href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* ── Nav bar ── */}
      <nav
        className="sticky top-0 z-50 transition-shadow duration-300"
        style={{
          backgroundColor: '#0a0a0f',
          borderBottom: '1px solid #1e2d4a',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" style={{ textDecoration: 'none' }}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight"
                style={{ background: 'linear-gradient(135deg,#60a5fa,#3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                MZAZI TECH
              </span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(l => (
                <Link key={l.href} href={l.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    color: isActive(l.href) ? '#3b82f6' : '#94a3b8',
                    backgroundColor: isActive(l.href) ? 'rgba(37,99,235,0.1)' : 'transparent',
                  }}>
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Quick inquiry button */}
              {user && (
                <div className="relative" ref={chatRef}>
                  <button
                    onClick={() => { setChatOpen(o => !o); setChatSent(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Support
                  </button>
                  {chatOpen && (
                    <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl overflow-hidden"
                      style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a', zIndex: 60 }}>
                      <div className="p-4 border-b" style={{ borderColor: '#1e2d4a' }}>
                        <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Quick Inquiry</p>
                        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>We reply within 2 hours</p>
                      </div>
                      {chatSent ? (
                        <div className="p-6 text-center">
                          <div className="text-3xl mb-2">✅</div>
                          <p className="font-semibold text-sm" style={{ color: '#4ade80' }}>Sent! We'll reply soon.</p>
                          <button onClick={() => setChatSent(false)} className="mt-3 text-xs" style={{ color: '#475569' }}>Send another</button>
                        </div>
                      ) : (
                        <form onSubmit={handleChatSubmit} className="p-4 space-y-3">
                          <input value={chatMsg.subject} onChange={e => setChatMsg(m => ({ ...m, subject: e.target.value }))}
                            placeholder="Subject" required
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }} />
                          <textarea value={chatMsg.message} onChange={e => setChatMsg(m => ({ ...m, message: e.target.value }))}
                            placeholder="Your message..." required rows={3}
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }} />
                          <button type="submit" disabled={chatLoading}
                            className="w-full py-2 rounded-lg text-sm font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: chatLoading ? 0.7 : 1 }}>
                            {chatLoading ? 'Sending…' : 'Send Inquiry'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Wallet balance */}
              {user && walletBalance !== null && (
                <Link href="/wallet"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  KSH {parseFloat(walletBalance).toLocaleString()}
                </Link>
              )}

              {/* Auth buttons */}
              {user ? (
                <>
                  <Link href="/dashboard"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                      {(user.firstname || user.email || 'U')[0].toUpperCase()}
                    </div>
                    {user.firstname || 'Account'}
                  </Link>
                  <button onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    Login
                  </Link>
                  <Link href="/signup"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile right: wallet + hamburger */}
            <div className="flex lg:hidden items-center gap-2">
              {user && walletBalance !== null && (
                <Link href="/wallet"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                  💳 KSH {parseFloat(walletBalance).toLocaleString()}
                </Link>
              )}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-lg"
                style={{ border: '1px solid #1e2d4a' }}
                aria-label="Toggle menu"
              >
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#94a3b8', transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none' }} />
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#94a3b8', opacity: menuOpen ? 0 : 1 }} />
                <span className="block w-5 h-0.5 transition-all duration-300"
                  style={{ backgroundColor: '#94a3b8', transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile menu dropdown ── */}
        <div
          className="lg:hidden overflow-hidden transition-all duration-300"
          style={{
            maxHeight: menuOpen ? '600px' : '0',
            borderTop: menuOpen ? '1px solid #1e2d4a' : 'none',
          }}
        >
          <div className="px-4 py-4 space-y-1" style={{ backgroundColor: '#0a0a0f' }}>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: isActive(l.href) ? '#3b82f6' : '#94a3b8',
                  backgroundColor: isActive(l.href) ? 'rgba(37,99,235,0.1)' : 'transparent',
                }}>
                {l.label}
              </Link>
            ))}

            <div className="pt-3 border-t" style={{ borderColor: '#1e2d4a' }}>
              {user ? (
                <div className="space-y-2">
                  {/* User info */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                      {(user.firstname || user.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>
                        {user.firstname ? `${user.firstname} ${user.lastname || ''}`.trim() : user.email}
                      </p>
                      <p className="text-xs" style={{ color: '#475569' }}>{user.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard"
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#94a3b8', backgroundColor: '#0f1629', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    📊 Dashboard
                  </Link>
                  <Link href="/wallet"
                    className="flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                    💳 Wallet · KSH {walletBalance !== null ? parseFloat(walletBalance).toLocaleString() : '—'}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium"
                    style={{ color: '#f87171', backgroundColor: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    🚪 Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login"
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    Log In
                  </Link>
                  <Link href="/signup"
                    className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                    Get Started — Free
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu backdrop */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMenuOpen(false)}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />
      )}
    </>
  );
}


// ============================================================
// FILE: Components/PterodactylPackages.js
// ============================================================
// This component is now replaced by the full products page at /products
// Kept for backwards compatibility
import Link from 'next/link';

export default function PterodactylPackages() {
  return (
    <div className="py-8 text-center">
      <Link href="/products" className="px-6 py-3 rounded-xl font-bold text-white inline-block"
        style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
        View All Plans →
      </Link>
    </div>
  );
}


// ============================================================
// FILE: Components/TechBackground.js
// ============================================================
'use client';
import { usePathname } from 'next/navigation';

// Different tech/computer images per route
const PAGE_BACKGROUNDS = {
  '/': {
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&q=70',
    label: 'circuit board',
  },
  '/products': {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=70',
    label: 'server rack',
  },
  '/about': {
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=70',
    label: 'retro computer screens',
  },
  '/contact': {
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1920&q=70',
    label: 'mechanical keyboard',
  },
  '/whatsapp-bot': {
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&q=70',
    label: 'blue neon tech',
  },
  '/dashboard': {
    url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&q=70',
    label: 'data analytics dashboard',
  },
  '/wallet': {
    url: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920&q=70',
    label: 'digital payment tech',
  },
  '/login': {
    url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1920&q=70',
    label: 'code on screen',
  },
  '/signup': {
    url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1920&q=70',
    label: 'code on screen',
  },
};

const DEFAULT_BG = {
  url: 'https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=1920&q=70',
  label: 'dark circuit board',
};

export default function TechBackground() {
  const pathname = usePathname();

  // Match exact path first, then prefix match
  const bg =
    PAGE_BACKGROUNDS[pathname] ||
    Object.entries(PAGE_BACKGROUNDS).find(([k]) => pathname.startsWith(k) && k !== '/')?.[1] ||
    DEFAULT_BG;

  return (
    <>
      {/* Tech photo layer */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `url('${bg.url}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.09,
          transition: 'background-image 0.6s ease',
        }}
      />

      {/* Blue grid scanline overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage:
            'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      {/* Vignette — darkens edges so text stays readable */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(10,10,15,0.75) 100%)',
        }}
      />
    </>
  );
}


// ============================================================
// FILE: Components/Testimonials.js
// ============================================================
'use client';
import { useState, useEffect } from 'react';

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange && onChange(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: 'none', border: 'none',
            cursor: readonly ? 'default' : 'pointer',
            padding: '2px',
            fontSize: readonly ? '18px' : '24px',
            color: star <= (hovered || value) ? '#facc15' : '#334155',
            transition: 'color 0.15s',
          }}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }) {
  const date = new Date(testimonial.created_at).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const initials = testimonial.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div
      style={{
        backgroundColor: 'rgba(22,24,42,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #1e2d4a',
        borderRadius: '16px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(37,99,235,0.2)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ color: '#2563eb', fontSize: '32px', lineHeight: 1, opacity: 0.6 }}>"</div>
      <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: '1.7', flex: 1 }}>{testimonial.message}</p>
      <StarRating value={testimonial.rating} readonly />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px', borderTop: '1px solid #1e2d4a' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '14px', color: '#fff', flexShrink: 0,
        }}>{initials}</div>
        <div>
          <div style={{ color: '#f0f4ff', fontWeight: 600, fontSize: '14px' }}>{testimonial.name}</div>
          <div style={{ color: '#475569', fontSize: '12px' }}>{date}</div>
        </div>
      </div>
    </div>
  );
}

function TestimonialForm({ onSubmitted }) {
  const [form, setForm] = useState({ name: '', rating: 0, message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.rating) { setError('Please select a star rating.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      setSuccess(true);
      setForm({ name: '', rating: 0, message: '' });
      if (onSubmitted) onSubmitted(data.testimonial);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div style={{ backgroundColor: 'rgba(22,24,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(37,99,235,0.4)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
        <h3 style={{ color: '#f0f4ff', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Thank You!</h3>
        <p style={{ color: '#64748b' }}>Your testimonial has been submitted successfully.</p>
        <button onClick={() => setSuccess(false)} style={{ marginTop: '20px', padding: '10px 24px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
          Add Another
        </button>
      </div>
    );
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    backgroundColor: 'rgba(10,10,20,0.7)', backdropFilter: 'blur(6px)',
    border: '1px solid #1e2d4a', color: '#f0f4ff', fontSize: '15px',
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: 'rgba(22,24,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid #1e2d4a', borderRadius: '16px', padding: '32px' }}>
      <h3 style={{ color: '#f0f4ff', fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Share Your Experience</h3>

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px 16px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Name *</label>
        <input type="text" placeholder="e.g. John Kamau" value={form.name} required
          onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Rating *</label>
        <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Testimonial *</label>
        <textarea placeholder="Tell others about your experience with MZAZI TECH..." value={form.message} required rows={5}
          onChange={e => setForm({ ...form, message: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
        <div style={{ color: '#475569', fontSize: '12px', marginTop: '6px', textAlign: 'right' }}>{form.message.length} / 1000</div>
      </div>

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '14px', borderRadius: '12px',
        background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        color: loading ? '#64748b' : '#fff', fontWeight: 700, fontSize: '16px',
        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
        boxShadow: loading ? 'none' : '0 0 24px rgba(37,99,235,0.35)', transition: 'all 0.2s',
      }}>
        {loading ? 'Submitting…' : 'Submit Testimonial'}
      </button>
    </form>
  );
}

const INITIAL_LIMIT = 6;
const MORE_LIMIT = 10;

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = async (offset, limit) => {
    const res = await fetch(`/api/testimonials?offset=${offset}&limit=${limit}`);
    const data = await res.json();
    return data;
  };

  useEffect(() => {
    fetchPage(0, INITIAL_LIMIT)
      .then(data => {
        setTestimonials(data.testimonials || []);
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await fetchPage(testimonials.length, MORE_LIMIT);
      setTestimonials(prev => [...prev, ...(data.testimonials || [])]);
      setTotal(data.total || total);
    } catch {}
    finally { setLoadingMore(false); }
  };

  const handleNewTestimonial = (t) => {
    setTestimonials(prev => [t, ...prev]);
    setTotal(prev => prev + 1);
  };

  const avgRating = testimonials.length
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : null;

  const hasMore = testimonials.length < total;

  return (
    <section style={{ backgroundColor: 'transparent', padding: '80px 0', position: 'relative' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '99px', marginBottom: '20px',
            backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
          }}>
            <span style={{ color: '#facc15', fontSize: '16px' }}>★</span>
            <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: 600 }}>
              {avgRating ? `${avgRating} avg rating · ` : ''}{total} {total === 1 ? 'review' : 'reviews'}
            </span>
          </div>
          <h2 style={{ color: '#f0f4ff', fontSize: '36px', fontWeight: 800, marginBottom: '12px' }}>What Our Clients Say</h2>
          <p style={{ color: '#64748b', fontSize: '16px', maxWidth: '480px', margin: '0 auto' }}>
            Real experiences from real customers across Kenya and beyond.
          </p>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#475569', padding: '40px 0' }}>Loading testimonials…</div>
        ) : testimonials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'rgba(22,24,42,0.85)', backdropFilter: 'blur(8px)', border: '1px solid #1e2d4a', borderRadius: '16px', marginBottom: '48px', color: '#64748b' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💬</div>
            <p>No testimonials yet — be the first to share your experience!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {testimonials.map(t => <TestimonialCard key={t.id} testimonial={t} />)}
            </div>

            {/* See More */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '12px 36px', borderRadius: '12px',
                    backgroundColor: 'rgba(37,99,235,0.1)',
                    color: '#60a5fa', border: '1px solid rgba(37,99,235,0.35)',
                    fontWeight: 600, fontSize: '15px', cursor: loadingMore ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'; }}
                >
                  {loadingMore ? 'Loading…' : `See More (${total - testimonials.length} remaining)`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Submit form */}
        <div style={{ maxWidth: '600px', margin: '32px auto 0' }}>
          <TestimonialForm onSubmitted={handleNewTestimonial} />
        </div>
      </div>
    </section>
  );
}


// ============================================================
// FILE: app/layout.js
// ============================================================
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TechBackground from '../components/TechBackground';
import './globals.css';

export const metadata = {
  title: 'MZAZI TECH INC - Technology & Automation Solutions',
  description: 'Your trusted partner for WhatsApp bots, Pterodactyl panel hosting, and automation solutions in Kenya.',
  keywords: 'pterodactyl hosting, whatsapp bot, automation, kenya, game server',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: '#0a0a0f', color: '#f0f4ff' }}>
        {/* Fixed tech background — sits behind everything */}
        <TechBackground />

        <Navbar />
        <main className="flex-grow" style={{ position: 'relative', zIndex: 1 }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}


// ============================================================
// FILE: app/globals.css
// ============================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── CSS variables ─────────────────────────────────── */
:root {
  --bg-base:    #0a0a0f;
  --bg-card:    #0f1629;
  --bg-nav:     #0a0a0f;
  --border:     #1e2d4a;
  --blue-main:  #2563eb;
  --blue-light: #60a5fa;
  --text-main:  #f0f4ff;
  --text-sub:   #94a3b8;
  --text-muted: #475569;
}

/* ─── Base resets ───────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}

body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--bg-base);
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
  min-height: 100vh;
}

/* Prevent zoom on form inputs on iOS */
input, select, textarea {
  font-size: max(16px, 1em);
}

/* ─── Scrollbar ─────────────────────────────────────── */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #0a0a0f; }
::-webkit-scrollbar-thumb { background: #1e2d4a; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #2563eb; }

/* ─── Selection ─────────────────────────────────────── */
::selection { background: rgba(37,99,235,0.3); color: #f0f4ff; }

/* ─── Focus ring ────────────────────────────────────── */
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* ─── Links ─────────────────────────────────────────── */
a { color: inherit; }

/* ─── Utility helpers ───────────────────────────────── */
.grid-bg {
  background-image:
    linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

.gradient-text {
  background: linear-gradient(135deg, #60a5fa, #2563eb, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glow-blue {
  box-shadow: 0 0 20px rgba(37,99,235,0.3);
}

/* ─── Card ──────────────────────────────────────────── */
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
}

/* ─── Animations ────────────────────────────────────── */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
@keyframes pulse-blue {
  0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
  50%       { box-shadow: 0 0 0 8px rgba(37,99,235,0); }
}
@keyframes shimmer {
  0%   { background-position: -1000px 0; }
  100% { background-position:  1000px 0; }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-float   { animation: float 4s ease-in-out infinite; }
.animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }

/* ─── Spinner ───────────────────────────────────────── */
.spinner {
  width: 40px; height: 40px;
  border: 2px solid #1e2d4a;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Responsive table → stacked on mobile ──────────── */
@media (max-width: 640px) {
  .table-responsive thead { display: none; }
  .table-responsive tr {
    display: block;
    margin-bottom: 1rem;
    padding: 0.75rem;
    border-radius: 0.75rem;
    background: #0f1629;
    border: 1px solid #1e2d4a;
  }
  .table-responsive td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.4rem 0;
    border: none;
    font-size: 0.8rem;
  }
  .table-responsive td::before {
    content: attr(data-label);
    font-weight: 600;
    color: #475569;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

/* ─── Page-width container ──────────────────────────── */
.container-site {
  max-width: 1280px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}
@media (min-width: 640px) {
  .container-site { padding-left: 1.5rem; padding-right: 1.5rem; }
}
@media (min-width: 1024px) {
  .container-site { padding-left: 2rem; padding-right: 2rem; }
}

