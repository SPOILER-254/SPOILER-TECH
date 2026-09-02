// ============================================================
// FILE 2: Frontend Pages
// Contains: All page.js files from the app/ routes
// Repository: Samsung-xmd by frozenlorddev
// ============================================================


// ============================================================
// FILE: Samsung-xmd-main/app/about/page.js
// ============================================================
import Link from 'next/link';

const values = [
  { icon: '⚡', title: 'Speed First', desc: 'Deploy servers in under 2 minutes. No waiting, no friction — just instant results.' },
  { icon: '🔒', title: 'Security', desc: 'Enterprise-grade security with encrypted connections and isolated server environments.' },
  { icon: '🇰🇪', title: 'Kenya Focused', desc: 'Built for Kenyan businesses. M-Pesa payments, local support, KSH pricing.' },
  { icon: '💬', title: '24/7 Support', desc: 'Our team is always available via Telegram to help you with any issue.' },
];

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden" style={{ background: 'linear-gradient(180deg, #071428, #0a0a0f)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider px-4 py-1.5 rounded-full inline-block mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>
            About Us
          </span>
          <h1 className="text-5xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>
            We Power Kenya's
            <br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Digital Infrastructure
            </span>
          </h1>
          <p className="text-lg" style={{ color: '#64748b' }}>
            MZAZI TECH INC is a Kenyan Tech Company specializing in game server hosting, WhatsApp automation, and digital infrastructure solutions. We believe powerful technology should be affordable and accessible to everyone.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>Our Mission</h2>
              <p className="text-lg mb-6" style={{ color: '#64748b' }}>
                To democratize access to powerful cloud infrastructure for Kenyan businesses and individuals. We offer enterprise-level Pterodactyl panel hosting at prices anyone can afford — starting from just KSH 50/month.
              </p>
              <p className="text-lg" style={{ color: '#64748b' }}>
                From small WhatsApp bots to large-scale game servers and perodactly panel for whatsapp bot, we provide the infrastructure backbone so you can focus on what matters — building your product.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { n: '500+', l: 'Active Panels' },
                { n: '1000+', l: 'Happy Clients' },
                { n: '99.9%', l: 'Uptime SLA' },
                { n: '24/7', l: 'Support Hours' },
              ].map(s => (
                <div key={s.l} className="p-6 rounded-2xl text-center" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                  <div className="text-3xl font-extrabold mb-1" style={{ color: '#3b82f6' }}>{s.n}</div>
                  <div className="text-sm" style={{ color: '#64748b' }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(v => (
              <div key={v.title} className="p-6 rounded-2xl" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: '#f0f4ff' }}>{v.title}</h3>
                <p className="text-sm" style={{ color: '#64748b' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Ready to get started?</h2>
          <p className="mb-8" style={{ color: '#64748b' }}>Join hundreds of Kenyans already using MZAZI TECH for their hosting needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-4 rounded-xl font-bold text-white inline-block"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>Get Started</Link>
            <Link href="/contact" className="px-8 py-4 rounded-xl font-bold inline-block"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>Contact Us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/dashboard/page.js
// ============================================================
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      Promise.all([
        fetch('/api/admin/users').then(r => r.ok ? r.json() : { users: [] }),
        fetch('/api/admin/transactions').then(r => r.ok ? r.json() : { transactions: [], orders: [], stats: {} }),
        fetch('/api/admin/inquiries').then(r => r.ok ? r.json() : { inquiries: [] }),
      ]).then(([users, tx, inq]) => {
        setStats({
          totalUsers: users.users.length,
          totalRevenue: tx.stats?.total_revenue || 0,
          completedOrders: tx.stats?.completed_orders || 0,
          openInquiries: inq.inquiries.filter(i => i.status === 'open').length,
          recentInquiries: inq.inquiries.slice(0, 5),
          recentUsers: users.users.slice(0, 5),
        });
        setLoading(false);
      });
    });
  }, []);

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };

  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="h-14" />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: '#64748b' }}>Loading admin panel...</p>
        </div>
      </div>
    </div>
  );

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', href: '/admin/users' },
    { label: 'Total Revenue', value: `KSH ${parseFloat(stats.totalRevenue).toLocaleString()}`, icon: '💰', color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)', href: '/admin/transactions' },
    { label: 'Completed Orders', value: stats.completedOrders, icon: '✅', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', href: '/admin/transactions' },
    { label: 'Open Inquiries', value: stats.openInquiries, icon: '💬', color: '#fb923c', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.2)', href: '/admin/inquiries' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      {/* Top bar */}
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>Restricted</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.05)' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Nav tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { href: '/admin/dashboard', label: 'Overview', active: true },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/transactions', label: 'Transactions' },
            { href: '/admin/inquiries', label: 'Inquiries' },
            { href: '/admin/packages', label: 'Packages' },
            { href: '/admin/vouchers', label: 'Vouchers & Recoveries' },
          ].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)', color: n.active ? '#f87171' : '#64748b', border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030' }}>
              {n.label}
            </Link>
          ))}
        </div>

        <h1 className="text-2xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>Dashboard Overview</h1>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map(c => (
            <Link href={c.href} key={c.label} className="rounded-2xl p-5 transition-all hover:scale-105 cursor-pointer"
              style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-2xl font-extrabold mb-1" style={{ color: c.color }}>{c.value}</div>
              <div className="text-xs" style={{ color: '#64748b' }}>{c.label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inquiries */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Recent Inquiries</h2>
              <Link href="/admin/inquiries" className="text-xs" style={{ color: '#3b82f6' }}>View all →</Link>
            </div>
            {stats.recentInquiries.length > 0 ? (
              <div className="space-y-3">
                {stats.recentInquiries.map(inq => (
                  <div key={inq.id} className="p-3 rounded-xl" style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#f0f4ff' }}>{inq.subject}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#64748b' }}>{inq.user_email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0"
                        style={{ backgroundColor: inq.status === 'open' ? 'rgba(251,146,60,0.15)' : 'rgba(74,222,128,0.1)', color: inq.status === 'open' ? '#fb923c' : '#4ade80' }}>
                        {inq.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-center py-4" style={{ color: '#374151' }}>No inquiries yet</p>}
          </div>

          {/* Recent Users */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Recent Sign-ups</h2>
              <Link href="/admin/users" className="text-xs" style={{ color: '#3b82f6' }}>View all →</Link>
            </div>
            {stats.recentUsers.length > 0 ? (
              <div className="space-y-3">
                {stats.recentUsers.map(u => (
                  <div key={u.id} className="flex items-center space-x-3 p-3 rounded-xl" style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                      {(u.firstname || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#f0f4ff' }}>{u.fullname || ((u.firstname || '') + ' ' + (u.lastname || '')).trim()}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>{u.email}</p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>KSH {parseFloat(u.wallet_balance || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-center py-4" style={{ color: '#374151' }}>No users yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/inquiries/page.js
// ============================================================
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_COLOR = { open: '#fb923c', replied: '#4ade80', closed: '#64748b' };

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [messages, setMessages]   = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [reply, setReply]         = useState('');
  const [replying, setReplying]   = useState(false);
  const [filter, setFilter]       = useState('all');
  // Mobile: 'list' | 'chat'
  const [mobileView, setMobileView] = useState('list');
  const bottomRef = useRef(null);
  const router    = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      loadInquiries();
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInquiries = async () => {
    const r = await fetch('/api/admin/inquiries');
    if (r.ok) { const d = await r.json(); setInquiries(d.inquiries || []); }
    setLoading(false);
  };

  const openThread = async (inq) => {
    setSelected(inq);
    setReply('');
    setMobileView('chat');
    setMsgLoading(true);
    try {
      const r = await fetch(`/api/admin/inquiries/${inq.id}/messages`);
      if (r.ok) {
        const d = await r.json();
        if (d.messages && d.messages.length > 0) {
          setMessages(d.messages);
        } else {
          const legacy = [{ id: 'lg-u', sender: 'user', message: inq.message, created_at: inq.created_at }];
          if (inq.admin_reply) legacy.push({ id: 'lg-a', sender: 'admin', message: inq.admin_reply, created_at: inq.replied_at || inq.created_at });
          setMessages(legacy);
        }
      }
    } finally { setMsgLoading(false); }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selected) return;
    setReplying(true);
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, admin_reply: reply, status: 'replied' }),
    });
    if (res.ok) {
      setMessages(m => [...m, { id: Date.now(), sender: 'admin', message: reply, created_at: new Date().toISOString() }]);
      setReply('');
      await loadInquiries();
      setSelected(p => ({ ...p, admin_reply: reply, status: 'replied' }));
    }
    setReplying(false);
  };

  const closeInquiry = async () => {
    await fetch('/api/admin/inquiries', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id }),
    });
    await loadInquiries();
    setSelected(p => ({ ...p, status: 'closed' }));
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };
  const filtered = inquiries.filter(i => filter === 'all' || i.status === filter);

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '';
  const fmtDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), today = new Date(), yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  };

  const openCount = inquiries.filter(i => i.status === 'open').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-40" style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', background: 'none', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">

        {/* ── Sub-nav (scrollable on mobile) ── */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { href: '/admin/dashboard', label: 'Overview' },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/transactions', label: 'Transactions' },
            { href: '/admin/inquiries', label: 'Inquiries', active: true, badge: openCount },
            { href: '/admin/packages', label: 'Packages' },
            { href: '/admin/vouchers', label: 'Vouchers & Recoveries' },
          ].map(n => (
            <Link key={n.href} href={n.href}
              className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap flex items-center gap-1.5"
              style={{
                backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)',
                color: n.active ? '#f87171' : '#64748b',
                border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030',
                textDecoration: 'none', flexShrink: 0,
              }}>
              {n.label}
              {n.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ backgroundColor: '#dc2626', color: '#fff' }}>
                  {n.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* ── Page header + filters ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-lg sm:text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Member Inquiries</h1>
          <div className="flex gap-1.5 flex-wrap">
            {['all', 'open', 'replied', 'closed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium capitalize"
                style={{
                  backgroundColor: filter === f ? 'rgba(59,130,246,0.15)' : '#0a0c14',
                  color: filter === f ? '#60a5fa' : '#64748b',
                  border: filter === f ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2030',
                  cursor: 'pointer',
                }}>
                {f}{f === 'open' && openCount > 0 ? ` (${openCount})` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* ── Chat UI ── */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030' }}>

          {/* ─── MOBILE ─── */}
          <div className="block md:hidden" style={{ height: 'calc(100dvh - 220px)', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>

            {mobileView === 'list' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2030', backgroundColor: '#060810', flexShrink: 0 }}>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                    {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-sm" style={{ color: '#374151' }}>No inquiries</p>
                    </div>
                  ) : filtered.map(inq => (
                    <AdminThreadRow key={inq.id} inq={inq} active={false} onClick={() => openThread(inq)} fmtDate={fmtDate} />
                  ))}
                </div>
              </div>
            )}

            {mobileView === 'chat' && selected && (
              <AdminChatWindow
                selected={selected} messages={messages} msgLoading={msgLoading}
                reply={reply} setReply={setReply}
                replying={replying} onReply={handleReply} onClose={closeInquiry}
                bottomRef={bottomRef} fmtTime={fmtTime} fmtDate={fmtDate}
                onBack={() => setMobileView('list')}
                showBack={true}
              />
            )}
          </div>

          {/* ─── DESKTOP ─── */}
          <div className="hidden md:flex" style={{ height: '620px' }}>
            {/* Left: thread list */}
            <div style={{ width: '280px', minWidth: '220px', borderRight: '1px solid #1e2030', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #1e2030', backgroundColor: '#060810', flexShrink: 0 }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#475569' }}>
                  {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm" style={{ color: '#374151' }}>No inquiries</p>
                  </div>
                ) : filtered.map(inq => (
                  <AdminThreadRow key={inq.id} inq={inq} active={selected?.id === inq.id} onClick={() => openThread(inq)} fmtDate={fmtDate} />
                ))}
              </div>
            </div>

            {/* Right: chat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              {selected ? (
                <AdminChatWindow
                  selected={selected} messages={messages} msgLoading={msgLoading}
                  reply={reply} setReply={setReply}
                  replying={replying} onReply={handleReply} onClose={closeInquiry}
                  bottomRef={bottomRef} fmtTime={fmtTime} fmtDate={fmtDate}
                  showBack={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <div className="text-5xl">💬</div>
                  <p className="font-bold" style={{ color: '#f0f4ff' }}>Select a conversation</p>
                  <p className="text-sm" style={{ color: '#374151' }}>Click any inquiry on the left to view the chat.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────────────── */

function AdminThreadRow({ inq, active, onClick, fmtDate }) {
  const color = STATUS_COLOR[inq.status] || '#fb923c';
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 transition-all"
      style={{
        backgroundColor: active ? 'rgba(37,99,235,0.1)' : 'transparent',
        borderBottom: '1px solid rgba(30,32,48,0.7)',
        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        cursor: 'pointer',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {inq.status === 'open' && <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#fb923c' }} />}
            <p className="text-xs font-bold truncate" style={{ color: '#f0f4ff' }}>{inq.user_name || inq.user_email || 'Unknown'}</p>
          </div>
          <p className="text-xs truncate" style={{ color: '#64748b' }}>{inq.subject}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#374151' }}>
            {inq.last_sender === 'admin' ? '🛡 ' : ''}{(inq.last_message || inq.message || '').slice(0, 35)}…
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-xs" style={{ color: '#374151' }}>{fmtDate(inq.updated_at || inq.created_at)}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}1a`, color }}>
            {inq.status}
          </span>
        </div>
      </div>
    </button>
  );
}

function AdminChatWindow({ selected, messages, msgLoading, reply, setReply, replying, onReply, onClose, bottomRef, fmtTime, fmtDate, onBack, showBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid #1e2030', backgroundColor: '#060810', flexShrink: 0 }}>
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
              style={{ color: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer' }}>
              ←
            </button>
          )}
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
            {(selected.user_name || selected.user_email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{selected.user_name || selected.user_email}</p>
            <p className="text-xs truncate" style={{ color: '#64748b' }}>{selected.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${STATUS_COLOR[selected.status] || '#fb923c'}1a`, color: STATUS_COLOR[selected.status] || '#fb923c', border: `1px solid ${STATUS_COLOR[selected.status] || '#fb923c'}30` }}>
            {selected.status}
          </span>
          {selected.status !== 'closed' && (
            <button onClick={onClose}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ backgroundColor: 'rgba(100,116,139,0.1)', color: '#64748b', border: '1px solid rgba(100,116,139,0.2)', cursor: 'pointer' }}>
              Close
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', backgroundColor: '#060810', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {msgLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.map((msg, i) => {
          const isAdmin = msg.sender === 'admin';
          const showDate = i === 0 || fmtDate(messages[i - 1].created_at) !== fmtDate(msg.created_at);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(30,32,48,0.9)', color: '#475569' }}>
                    {fmtDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isAdmin && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff' }}>
                    {(selected.user_name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="px-3 py-2 text-sm leading-relaxed"
                  style={{
                    maxWidth: 'min(75%, 360px)',
                    background: isAdmin ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : '#1a2640',
                    color: '#fff',
                    borderRadius: isAdmin ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: isAdmin ? '0 2px 8px rgba(220,38,38,0.25)' : '0 1px 4px rgba(0,0,0,0.4)',
                  }}>
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                    {fmtTime(msg.created_at)}{isAdmin ? ' ✓✓' : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #1e2030', backgroundColor: '#060810', flexShrink: 0 }}>
        {selected.status === 'closed' ? (
          <p className="text-xs text-center py-1" style={{ color: '#374151' }}>This inquiry is closed.</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onReply(); } }}
              placeholder="Type your reply… (Enter to send)"
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: '#111827', border: '1px solid #1e2030', color: '#f0f4ff', resize: 'none', maxHeight: '100px' }}
            />
            <button onClick={onReply} disabled={replying || !reply.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: replying || !reply.trim() ? '#1e2030' : 'linear-gradient(135deg,#dc2626,#b91c1c)',
                cursor: replying || !reply.trim() ? 'not-allowed' : 'pointer', border: 'none',
              }}>
              {replying
                ? <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/login/page.js
// ============================================================
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => { if (r.ok) router.replace('/admin/dashboard'); });
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) router.push('/admin/dashboard');
      else setError(data.error || 'Invalid credentials');
    } catch { setError('Connection error. Please try again.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#060810' }}>
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(239,68,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 0 40px rgba(220,38,38,0.3)' }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Admin Portal</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Restricted access — Mzazi Tech Inc.</p>
        </div>
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Admin Email</label>
              <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@mzazi.shop" className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }}
                onFocus={e => e.target.style.borderColor = '#dc2626'} onBlur={e => e.target.style.borderColor = '#1e2030'} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <input type="password" required value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }}
                onFocus={e => e.target.style.borderColor = '#dc2626'} onBlur={e => e.target.style.borderColor = '#1e2030'} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm mt-2"
              style={{ background: loading ? '#1e2030' : 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: loading ? 'none' : '0 0 30px rgba(220,38,38,0.3)', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
        <p className="text-center mt-6 text-xs" style={{ color: '#374151' }}>All admin activity is logged and monitored.</p>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/packages/page.js
// ============================================================
'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EMPTY = { name: '', price: '', cpu: '', ram: '', disk: '', description: '', popular: false, accent: '#2563eb', active: true, sort_order: '', expires_after_hours: '' };

function fmtCpu(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited CPU'  : `${n}% CPU`; }
function fmtRam(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited RAM'  : n >= 1024 ? `${n / 1024} GB RAM`  : `${n} MB RAM`; }
function fmtDisk(v) { const n = parseInt(v); return n === 0 ? 'Unlimited Disk' : n >= 1024 ? `${n / 1024} GB Disk` : `${n} MB Disk`; }

const inputStyle = { backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff', borderRadius: '0.75rem', padding: '0.625rem 1rem', width: '100%', fontSize: '0.875rem', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem', color: '#475569' };

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null); // null | 'add' | 'edit'
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError]       = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      load();
    });
  }, []);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/packages').then(r => r.json()).then(d => {
      setPackages(d.packages || []);
      setLoading(false);
    });
  };

  const handleRestoreDefaults = async () => {
    setRestoring(true);
    try {
      await fetch('/api/admin/packages/restore-defaults', { method: 'POST' });
      load();
    } catch {}
    setRestoring(false);
  };

  const openAdd  = () => { setForm(EMPTY); setError(''); setModal('add'); };
  const openEdit = (pkg) => { setForm({ ...pkg, price: String(pkg.price), cpu: String(pkg.cpu), ram: String(pkg.ram), disk: String(pkg.disk), sort_order: String(pkg.sort_order), expires_after_hours: pkg.expires_after_hours != null ? String(pkg.expires_after_hours) : '' }); setError(''); setModal('edit'); };
  const closeModal = () => { setModal(null); setError(''); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const isEdit = modal === 'edit';
    const url  = isEdit ? `/api/admin/packages/${form.id}` : '/api/admin/packages';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); setSaving(false); return; }
      closeModal(); load();
    } catch { setError('Network error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
      setDeleteId(null); load();
    } catch {}
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };

  const navTabs = [
    { href: '/admin/dashboard', label: 'Overview' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/transactions', label: 'Transactions' },
    { href: '/admin/inquiries', label: 'Inquiries' },
    { href: '/admin/packages', label: 'Packages', active: true },
    { href: '/admin/vouchers', label: 'Vouchers & Recoveries' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      {/* Top bar */}
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>Restricted</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.05)' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Nav tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {navTabs.map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)', color: n.active ? '#f87171' : '#64748b', border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030' }}>
              {n.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Packages</h1>
          <div className="flex items-center gap-2">
            <button onClick={handleRestoreDefaults} disabled={restoring} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ color: '#94a3b8', border: '1px solid #1e2030', opacity: restoring ? 0.6 : 1 }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {restoring ? 'Adding…' : 'Restore Defaults'}
            </button>
            <button onClick={openAdd} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Add Package
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
            {packages.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#374151' }}>No packages yet. Click "Add Package" to create one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1e2030' }}>
                      {['Name', 'Price', 'CPU', 'RAM', 'Disk', 'Popular', 'Active', 'Order', 'Actions'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg, i) => (
                      <tr key={pkg.id} style={{ borderBottom: i < packages.length - 1 ? '1px solid #1e2030' : 'none' }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: pkg.accent }} />
                            <span className="font-semibold" style={{ color: '#f0f4ff' }}>{pkg.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold" style={{ color: '#4ade80' }}>KSH {parseFloat(pkg.price).toLocaleString()}</td>
                        <td className="px-5 py-4" style={{ color: '#94a3b8' }}>{fmtCpu(pkg.cpu)}</td>
                        <td className="px-5 py-4" style={{ color: '#94a3b8' }}>{fmtRam(pkg.ram)}</td>
                        <td className="px-5 py-4" style={{ color: '#94a3b8' }}>{fmtDisk(pkg.disk)}</td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: pkg.popular ? 'rgba(37,99,235,0.15)' : 'rgba(30,32,48,0.8)', color: pkg.popular ? '#60a5fa' : '#475569', border: `1px solid ${pkg.popular ? 'rgba(37,99,235,0.3)' : '#1e2030'}` }}>
                            {pkg.popular ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: pkg.active ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: pkg.active ? '#4ade80' : '#f87171', border: `1px solid ${pkg.active ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                            {pkg.active ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-5 py-4" style={{ color: '#64748b' }}>{pkg.sort_order}</td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(pkg)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)', backgroundColor: 'rgba(96,165,250,0.08)' }}>
                              Edit
                            </button>
                            <button onClick={() => setDeleteId(pkg.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', backgroundColor: 'rgba(248,113,113,0.08)' }}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeModal}>
          <div className="w-full max-w-lg rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }} onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-6" style={{ color: '#f0f4ff' }}>{modal === 'add' ? 'Add Package' : 'Edit Package'}</h2>
            {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label style={labelStyle}>Package Name</label>
                  <input style={inputStyle} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Pro" />
                </div>
                <div>
                  <label style={labelStyle}>Price (KSH/mo)</label>
                  <input style={inputStyle} type="number" min="0" step="0.01" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="150" />
                </div>
                <div>
                  <label style={labelStyle}>Sort Order</label>
                  <input style={inputStyle} type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="5" />
                </div>
                <div>
                  <label style={labelStyle}>Expires After (hours, leave blank = never)</label>
                  <input style={inputStyle} type="number" min="1" value={form.expires_after_hours} onChange={e => setForm(f => ({ ...f, expires_after_hours: e.target.value }))} placeholder="e.g. 6" />
                </div>
                <div>
                  <label style={labelStyle}>CPU % (0 = Unlimited)</label>
                  <input style={inputStyle} type="number" min="0" required value={form.cpu} onChange={e => setForm(f => ({ ...f, cpu: e.target.value }))} placeholder="100" />
                </div>
                <div>
                  <label style={labelStyle}>RAM MB (0 = Unlimited)</label>
                  <input style={inputStyle} type="number" min="0" required value={form.ram} onChange={e => setForm(f => ({ ...f, ram: e.target.value }))} placeholder="2048" />
                </div>
                <div>
                  <label style={labelStyle}>Disk MB (0 = Unlimited)</label>
                  <input style={inputStyle} type="number" min="0" required value={form.disk} onChange={e => setForm(f => ({ ...f, disk: e.target.value }))} placeholder="10240" />
                </div>
                <div>
                  <label style={labelStyle}>Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.accent} onChange={e => setForm(f => ({ ...f, accent: e.target.value }))} style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', border: '1px solid #1e2030', backgroundColor: '#0a0c14', cursor: 'pointer', padding: '2px' }} />
                    <input style={{ ...inputStyle, flex: 1 }} value={form.accent} onChange={e => setForm(f => ({ ...f, accent: e.target.value }))} placeholder="#2563eb" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label style={labelStyle}>Description</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '4rem' }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this plan is good for" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="popular" checked={!!form.popular} onChange={e => setForm(f => ({ ...f, popular: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#2563eb' }} />
                  <label htmlFor="popular" className="text-sm" style={{ color: '#94a3b8' }}>Mark as Popular</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="active" checked={!!form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: '#2563eb' }} />
                  <label htmlFor="active" className="text-sm" style={{ color: '#94a3b8' }}>Active (visible to users)</label>
                </div>
              </div>

              {/* Live preview */}
              <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: '#0a0c14', border: `1px solid ${form.accent || '#1e2030'}` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Preview</p>
                <p className="font-bold" style={{ color: '#f0f4ff' }}>{form.name || 'Package Name'}</p>
                <p className="font-extrabold text-xl" style={{ color: form.accent }}>KSH {form.price || '0'}<span className="text-xs font-normal ml-1" style={{ color: '#475569' }}>/mo</span></p>
                <p className="text-xs mt-1" style={{ color: '#64748b' }}>{fmtCpu(form.cpu || 0)} · {fmtRam(form.ram || 0)} · {fmtDisk(form.disk || 0)}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: '#94a3b8', border: '1px solid #1e2030' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : modal === 'add' ? 'Create Package' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: '#0f1117', border: '1px solid rgba(248,113,113,0.3)' }} onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>Delete Package?</h3>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>This cannot be undone. Existing panels using this package are unaffected.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: '#94a3b8', border: '1px solid #1e2030' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/transactions/page.js
// ============================================================
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminTransactions() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      fetch('/api/admin/transactions').then(async r2 => {
        if (r2.ok) { const d = await r2.json(); setData(d); }
        setLoading(false);
      });
    });
  }, []);

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };
  const sc = s => s === 'completed' ? '#4ade80' : s === 'pending' ? '#fb923c' : '#f87171';
  const sb = s => s === 'completed' ? 'rgba(74,222,128,0.1)' : s === 'pending' ? 'rgba(251,146,60,0.1)' : 'rgba(248,113,113,0.1)';

  const orders = (data?.orders || []).filter(o =>
    (o.user_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.reference || '').toLowerCase().includes(search.toLowerCase())
  );
  const txns = (data?.transactions || []).filter(t => (t.user_email || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>Sign Out</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {[{ href: '/admin/dashboard', label: 'Overview' }, { href: '/admin/users', label: 'Users' }, { href: '/admin/transactions', label: 'Transactions', active: true }, { href: '/admin/inquiries', label: 'Inquiries' }, { href: '/admin/packages', label: 'Packages' }, { href: '/admin/vouchers', label: 'Vouchers & Recoveries' }].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)', color: n.active ? '#f87171' : '#64748b', border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030' }}>
              {n.label}
            </Link>
          ))}
        </div>
        {data?.stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Revenue', value: `KSH ${parseFloat(data.stats.total_revenue || 0).toLocaleString()}`, color: '#4ade80' },
              { label: 'Completed Orders', value: data.stats.completed_orders || 0, color: '#3b82f6' },
              { label: 'Pending Orders', value: data.stats.pending_orders || 0, color: '#fb923c' },
            ].map(c => (
              <div key={c.label} className="rounded-2xl p-5" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
                <div className="text-xl font-extrabold mb-1" style={{ color: c.color }}>{c.value}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div className="flex space-x-2">
            {['orders', 'wallet'].map(t => (
              <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{ backgroundColor: tab === t ? 'rgba(59,130,246,0.15)' : '#0a0c14', color: tab === t ? '#60a5fa' : '#64748b', border: tab === t ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2030' }}>
                {t === 'orders' ? 'Orders' : 'Wallet Txns'}
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email or reference..."
            className="rounded-xl px-4 py-2.5 text-sm outline-none w-full sm:w-72"
            style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }} />
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : tab === 'orders' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ borderBottom: '1px solid #1e2030' }}>
                  {['Reference', 'User', 'Package', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #1e2030' : 'none' }}>
                      <td className="px-5 py-4 text-xs font-mono" style={{ color: '#475569' }}>{(o.reference || '—').slice(-12)}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>{o.user_email}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#f0f4ff' }}>{o.package_name}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#4ade80' }}>KSH {parseFloat(o.amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sb(o.status), color: sc(o.status) }}>{o.status}</span></td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#475569' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#374151' }}>No orders found</td></tr>}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr style={{ borderBottom: '1px solid #1e2030' }}>
                  {['User', 'Type', 'Amount', 'Description', 'Status', 'Date'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {txns.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: i < txns.length - 1 ? '1px solid #1e2030' : 'none' }}>
                      <td className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>{t.user_email}</td>
                      <td className="px-5 py-4 text-sm capitalize" style={{ color: '#f0f4ff' }}>{t.type}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: t.type === 'debit' ? '#f87171' : '#4ade80' }}>{t.type === 'debit' ? '-' : '+'}KSH {parseFloat(t.amount).toLocaleString()}</td>
                      <td className="px-5 py-4 text-xs max-w-xs truncate" style={{ color: '#64748b' }}>{t.description}</td>
                      <td className="px-5 py-4"><span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: sb(t.status), color: sc(t.status) }}>{t.status}</span></td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#475569' }}>{new Date(t.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {txns.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#374151' }}>No transactions found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/users/page.js
// ============================================================
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      fetch('/api/admin/users').then(async r2 => {
        if (r2.ok) { const d = await r2.json(); setUsers(d.users); }
        setLoading(false);
      });
    });
  }, []);

  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.fullname || '').toLowerCase().includes(search.toLowerCase()) ||
    ((u.firstname || '') + ' ' + (u.lastname || '')).toLowerCase().includes(search.toLowerCase())
  );

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>Sign Out</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {[{ href: '/admin/dashboard', label: 'Overview' }, { href: '/admin/users', label: 'Users', active: true }, { href: '/admin/transactions', label: 'Transactions' }, { href: '/admin/inquiries', label: 'Inquiries' }, { href: '/admin/packages', label: 'Packages' }, { href: '/admin/vouchers', label: 'Vouchers & Recoveries' }].map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)', color: n.active ? '#f87171' : '#64748b', border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030' }}>
              {n.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>
            All Users <span className="text-base font-normal" style={{ color: '#64748b' }}>({filtered.length})</span>
          </h1>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            className="rounded-xl px-4 py-2.5 text-sm outline-none w-full sm:w-72"
            style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }} />
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2030' }}>
                    {['ID', 'Name', 'Email', 'Wallet Balance', 'Orders', 'Joined'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #1e2030' : 'none' }}>
                      <td className="px-5 py-4 text-xs" style={{ color: '#475569' }}>#{u.id}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                            {(u.firstname || u.email || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#f0f4ff' }}>{u.fullname || ((u.firstname || '') + ' ' + (u.lastname || '')).trim() || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>{u.email}</td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#4ade80' }}>KSH {parseFloat(u.wallet_balance || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>{u.total_orders}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#475569' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: '#374151' }}>No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/admin/vouchers/page.js
// ============================================================
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/admin/me').then(r => {
      if (!r.ok) { router.replace('/admin/login'); return; }
      loadVouchers();
    });
  }, []);

  const loadVouchers = async () => {
    const r = await fetch('/api/admin/vouchers');
    if (r.ok) { const d = await r.json(); setVouchers(d.vouchers || []); }
    setLoading(false);
  };

  const logout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/admin/login'); };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (code.trim().length !== 6) {
      setMessage({ type: 'error', text: 'Code must be exactly 6 characters.' });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase(), amount: parseFloat(amount) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Voucher ${code.trim().toUpperCase()} activated for KSH ${parseFloat(amount).toLocaleString()}` });
        setCode('');
        setAmount('');
        loadVouchers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create voucher.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setCreating(false);
    }
  };

  const navTabs = [
    { href: '/admin/dashboard', label: 'Overview' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/transactions', label: 'Transactions' },
    { href: '/admin/inquiries', label: 'Inquiries' },
    { href: '/admin/packages', label: 'Packages' },
    { href: '/admin/vouchers', label: 'Vouchers & Recoveries', active: true },
  ];

  const statusColor = (s) => s === 'active' ? '#4ade80' : s === 'used' ? '#64748b' : '#fb923c';
  const statusBg = (s) => s === 'active' ? 'rgba(74,222,128,0.1)' : s === 'used' ? 'rgba(100,116,139,0.1)' : 'rgba(251,146,60,0.1)';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060810' }}>
      {/* Top bar */}
      <div style={{ backgroundColor: '#0a0c14', borderBottom: '1px solid #1e2030' }} className="sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Admin Panel</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(220,38,38,0.15)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>Restricted</span>
          </div>
          <button onClick={logout} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>Sign Out</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Nav tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {navTabs.map(n => (
            <Link key={n.href} href={n.href} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ backgroundColor: n.active ? 'rgba(220,38,38,0.15)' : 'rgba(30,32,48,0.5)', color: n.active ? '#f87171' : '#64748b', border: n.active ? '1px solid rgba(220,38,38,0.3)' : '1px solid #1e2030' }}>
              {n.label}
            </Link>
          ))}
        </div>

        <h1 className="text-2xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>Vouchers &amp; Recoveries</h1>

        {/* Alert */}
        {message && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{
            backgroundColor: message.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            color: message.type === 'success' ? '#4ade80' : '#f87171',
          }}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Create Voucher Form */}
          <div className="lg:col-span-1 rounded-2xl p-6" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#475569' }}>Create &amp; Activate Voucher</p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#64748b' }}>Voucher Code (6 characters)</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono tracking-widest"
                  style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }}
                  required
                />
                <p className="mt-1 text-xs" style={{ color: '#374151' }}>{code.length}/6 characters</p>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: '#64748b' }}>Amount (KSH)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#0a0c14', border: '1px solid #1e2030', color: '#f0f4ff' }}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={creating || code.length !== 6 || !amount}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff',
                  opacity: (creating || code.length !== 6 || !amount) ? 0.5 : 1,
                  cursor: (creating || code.length !== 6 || !amount) ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Activating...' : 'Activate Code'}
              </button>
            </form>

            <div className="mt-6 p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', color: '#64748b', lineHeight: 1.6 }}>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>How it works:</span><br />
              Enter any 6-character code (letters/numbers), set the KSH amount, then click Activate Code. The code is immediately usable by one member to credit their wallet.
            </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 content-start">
            {[
              { label: 'Total Vouchers', value: vouchers.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
              { label: 'Active (unused)', value: vouchers.filter(v => v.status === 'active').length, color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.2)' },
              { label: 'Used', value: vouchers.filter(v => v.status === 'used').length, color: '#64748b', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.2)' },
            ].map(c => (
              <div key={c.label} className="rounded-2xl p-5" style={{ backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                <div className="text-3xl font-extrabold mb-1" style={{ color: c.color }}>{c.value}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{c.label}</div>
              </div>
            ))}
            <div className="sm:col-span-3 rounded-2xl p-5" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
              <div className="text-2xl font-extrabold mb-1" style={{ color: '#a78bfa' }}>
                KSH {vouchers.filter(v => v.status === 'used').reduce((s, v) => s + parseFloat(v.amount), 0).toLocaleString()}
              </div>
              <div className="text-xs" style={{ color: '#64748b' }}>Total redeemed via vouchers</div>
            </div>
          </div>
        </div>

        {/* Vouchers Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1117', border: '1px solid #1e2030' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #1e2030' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>All Vouchers ({vouchers.length})</p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vouchers.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: '#374151' }}>No vouchers created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2030' }}>
                    {['Code', 'Amount', 'Status', 'Used By', 'Used At', 'Created'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v, i) => (
                    <tr key={v.id} style={{ borderBottom: i < vouchers.length - 1 ? '1px solid #1e2030' : 'none' }}>
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-sm tracking-widest" style={{ color: '#f0f4ff' }}>{v.code}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold" style={{ color: '#4ade80' }}>
                        KSH {parseFloat(v.amount).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: statusBg(v.status), color: statusColor(v.status), border: `1px solid ${statusColor(v.status)}40` }}>
                          {v.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: '#94a3b8' }}>{v.used_by_email || '—'}</td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#475569' }}>
                        {v.used_at ? new Date(v.used_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: '#475569' }}>
                        {new Date(v.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/contact/page.js
// ============================================================
'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const channels = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc', title: 'Telegram', desc: 'Replies within minutes.',
    action: 'Open Telegram', href: 'https://t.me/mzazitech',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25d366', title: 'WhatsApp', desc: 'Chat with support team.',
    action: 'Chat on WhatsApp', href: 'https://wa.me/254108595201',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    color: '#3b82f6', title: 'Email', desc: 'Billing & formal inquiries.',
    action: 'Send Email', href: 'mailto:mzazitechinc@gmail.com',
  },
];

const STATUS_COLOR = { open: '#fb923c', replied: '#4ade80', closed: '#64748b' };

export default function ContactPage() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [threads, setThreads]         = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [msgLoading, setMsgLoading]   = useState(false);
  const [newMsg, setNewMsg]           = useState('');
  const [sending, setSending]         = useState(false);
  const [newSubject, setNewSubject]   = useState('');
  const [composing, setComposing]     = useState(false);
  const [alert, setAlert]             = useState(null);
  // Mobile: 'list' | 'chat' | 'compose'
  const [mobileView, setMobileView]   = useState('list');
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user) { setUser(d.user); loadThreads(); } })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadThreads = async () => {
    const r = await fetch('/api/inquiries');
    if (r.ok) { const d = await r.json(); setThreads(d.inquiries || []); }
  };

  const openThread = async (thread) => {
    setActiveThread(thread);
    setComposing(false);
    setMobileView('chat');
    setMsgLoading(true);
    try {
      const r = await fetch(`/api/inquiries/${thread.id}`);
      if (r.ok) {
        const d = await r.json();
        if (d.messages && d.messages.length > 0) {
          setMessages(d.messages);
        } else {
          const legacy = [{ id: 'lu', sender: 'user', message: thread.message, created_at: thread.created_at }];
          if (thread.admin_reply) legacy.push({ id: 'la', sender: 'admin', message: thread.admin_reply, created_at: thread.replied_at || thread.created_at });
          setMessages(legacy);
        }
      }
    } finally {
      setMsgLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  };

  const backToList = () => {
    setMobileView('list');
    setActiveThread(null);
    setComposing(false);
    setMessages([]);
  };

  const openCompose = () => {
    setComposing(true);
    setActiveThread(null);
    setMessages([]);
    setMobileView('compose');
    setAlert(null);
    setNewMsg('');
    setNewSubject('');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeThread) return;
    setSending(true);
    try {
      const res = await fetch(`/api/inquiries/${activeThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMsg.trim() }),
      });
      if (res.ok) {
        setMessages(m => [...m, { id: Date.now(), sender: 'user', message: newMsg.trim(), created_at: new Date().toISOString() }]);
        setNewMsg('');
        loadThreads();
      }
    } finally { setSending(false); }
  };

  const startNewInquiry = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMsg.trim()) return;
    setSending(true);
    setAlert(null);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject.trim(), message: newMsg.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlert({ type: 'success', text: '✅ Inquiry sent! Our team will reply within 2 hours.' });
        setNewSubject(''); setNewMsg('');
        await loadThreads();
        const r2 = await fetch('/api/inquiries');
        if (r2.ok) {
          const d2 = await r2.json();
          const latest = (d2.inquiries || [])[0];
          if (latest) openThread(latest);
        }
      } else {
        setAlert({ type: 'error', text: data.error || 'Failed to send inquiry.' });
      }
    } finally { setSending(false); }
  };

  const fmtTime = (ts) => ts ? new Date(ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) : '';
  const fmtDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), today = new Date(), yest = new Date(today);
    yest.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yest.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div style={{ backgroundColor: '#0a0a0f', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section className="relative py-14 sm:py-20" style={{ background: 'linear-gradient(180deg,#071428 0%,#0a0a0f 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.05) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
            💬 24/7 Support Available
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>Contact Us</h1>
          <p className="text-sm sm:text-lg" style={{ color: '#64748b' }}>
            Reach out through any channel or message us directly below.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">

        {/* ── Quick channels ── */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8">
          {channels.map(c => (
            <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
              className="flex flex-col items-center p-3 sm:p-5 rounded-2xl transition-all hover:scale-[1.02] text-center no-underline"
              style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 sm:mb-3"
                style={{ backgroundColor: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>
                {c.icon}
              </div>
              <p className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1" style={{ color: '#f0f4ff' }}>{c.title}</p>
              <p className="text-xs hidden sm:block mb-3" style={{ color: '#64748b' }}>{c.desc}</p>
              <span className="text-xs font-semibold px-2 py-1 rounded-lg hidden sm:inline-block"
                style={{ backgroundColor: `${c.color}18`, color: c.color, border: `1px solid ${c.color}30` }}>
                {c.action}
              </span>
            </a>
          ))}
        </div>

        {/* ── Chat Section ── */}
        {authLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          </div>
        ) : !user ? (
          <div className="rounded-2xl p-8 sm:p-10 text-center" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <div className="text-5xl mb-4">🔒</div>
            <p className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>Login to Send Inquiries</p>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>Log in to chat with our support team directly from here.</p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>Log In</Link>
              <Link href="/signup" className="px-5 py-2.5 rounded-xl text-sm font-semibold"
                style={{ backgroundColor: '#1e2d4a', color: '#94a3b8', textDecoration: 'none' }}>Sign Up</Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>

            {/* ─────────── MOBILE layout ─────────── */}
            <div className="block md:hidden" style={{ height: 'calc(100dvh - 280px)', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>

              {mobileView === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Mobile list header */}
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
                    <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Support Chat</p>
                    <button onClick={openCompose}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', cursor: 'pointer' }}>
                      ✏️ New
                    </button>
                  </div>
                  {/* Thread list */}
                  <div style={{ flex: 1, overflowY: 'auto' }}>
                    {threads.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                        <div className="text-4xl">💬</div>
                        <p className="text-sm font-semibold" style={{ color: '#f0f4ff' }}>No conversations yet</p>
                        <p className="text-xs" style={{ color: '#475569' }}>Tap New to start a conversation with support.</p>
                        <button onClick={openCompose}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white mt-2"
                          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', cursor: 'pointer' }}>
                          Start Chat
                        </button>
                      </div>
                    ) : threads.map(t => (
                      <ThreadRow key={t.id} t={t} active={false} onClick={() => openThread(t)} fmtDate={fmtDate} />
                    ))}
                  </div>
                </div>
              )}

              {mobileView === 'compose' && (
                <ComposeForm
                  newSubject={newSubject} setNewSubject={setNewSubject}
                  newMsg={newMsg} setNewMsg={setNewMsg}
                  sending={sending} alert={alert}
                  onBack={backToList} onSubmit={startNewInquiry}
                />
              )}

              {mobileView === 'chat' && activeThread && (
                <ChatWindow
                  thread={activeThread} messages={messages} msgLoading={msgLoading}
                  newMsg={newMsg} setNewMsg={setNewMsg}
                  sending={sending} onSend={sendMessage}
                  bottomRef={bottomRef} inputRef={inputRef}
                  fmtTime={fmtTime} fmtDate={fmtDate}
                  onBack={backToList}
                  showBack={true}
                />
              )}
            </div>

            {/* ─────────── DESKTOP layout ─────────── */}
            <div className="hidden md:flex" style={{ height: '620px' }}>
              {/* Left: thread list */}
              <div style={{ width: '300px', minWidth: '240px', borderRight: '1px solid #1e2d4a', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
                  <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Support Chat</p>
                  <button onClick={openCompose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                    style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.25)', cursor: 'pointer' }}
                    title="New Inquiry">✏️</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
                      <div className="text-4xl">💬</div>
                      <p className="text-xs" style={{ color: '#475569' }}>No conversations yet. Start one!</p>
                    </div>
                  ) : threads.map(t => (
                    <ThreadRow key={t.id} t={t} active={activeThread?.id === t.id && !composing} onClick={() => openThread(t)} fmtDate={fmtDate} />
                  ))}
                </div>
              </div>

              {/* Right: chat or compose */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {composing ? (
                  <ComposeForm
                    newSubject={newSubject} setNewSubject={setNewSubject}
                    newMsg={newMsg} setNewMsg={setNewMsg}
                    sending={sending} alert={alert}
                    onBack={() => { setComposing(false); setAlert(null); }}
                    onSubmit={startNewInquiry}
                    desktop
                  />
                ) : activeThread ? (
                  <ChatWindow
                    thread={activeThread} messages={messages} msgLoading={msgLoading}
                    newMsg={newMsg} setNewMsg={setNewMsg}
                    sending={sending} onSend={sendMessage}
                    bottomRef={bottomRef} inputRef={inputRef}
                    fmtTime={fmtTime} fmtDate={fmtDate}
                    showBack={false}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="text-6xl">💬</div>
                    <div className="text-center">
                      <p className="font-bold mb-1" style={{ color: '#f0f4ff' }}>Your Support Chats</p>
                      <p className="text-sm mb-5" style={{ color: '#64748b' }}>Select a conversation or start a new one.</p>
                      <button onClick={openCompose}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', cursor: 'pointer' }}>
                        ✏️ New Inquiry
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </section>
    </div>
  );
}

/* ── Shared sub-components ─────────────────────────────────────────────────── */

function ThreadRow({ t, active, onClick, fmtDate }) {
  const color = STATUS_COLOR[t.status] || '#fb923c';
  return (
    <button onClick={onClick} className="w-full text-left px-4 py-3 transition-all"
      style={{
        backgroundColor: active ? 'rgba(37,99,235,0.1)' : 'transparent',
        borderBottom: '1px solid rgba(30,45,74,0.5)',
        borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
        cursor: 'pointer',
      }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: '#f0f4ff' }}>{t.subject}</p>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>
            {t.last_sender === 'admin' ? '🛡 Admin: ' : 'You: '}
            {(t.last_message || t.message || '').slice(0, 38)}{(t.last_message || t.message || '').length > 38 ? '…' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <p className="text-xs" style={{ color: '#374151' }}>{fmtDate(t.updated_at || t.created_at)}</p>
          <span className="text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}30` }}>
            {t.status}
          </span>
        </div>
      </div>
    </button>
  );
}

function ComposeForm({ newSubject, setNewSubject, newMsg, setNewMsg, sending, alert, onBack, onSubmit, desktop }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3"
        style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
        <button onClick={onBack}
          className="flex items-center gap-1 text-sm"
          style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← {desktop ? 'Back' : 'Back'}
        </button>
        <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>New Inquiry</p>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '16px', gap: '12px', overflowY: 'auto' }}>
        {alert && (
          <div className="p-3 rounded-xl text-sm"
            style={{
              backgroundColor: alert.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${alert.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: alert.type === 'success' ? '#4ade80' : '#f87171',
            }}>{alert.text}</div>
        )}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Subject</label>
          <input type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
            placeholder="e.g. Panel not starting, Billing issue…"
            required className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#1e2d4a'}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Message</label>
          <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="Describe your issue in detail…"
            required rows={5} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff', width: '100%' }}
            onFocus={e => e.target.style.borderColor = '#2563eb'}
            onBlur={e => e.target.style.borderColor = '#1e2d4a'}
          />
        </div>
        <button type="submit" disabled={sending}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: sending ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', cursor: sending ? 'not-allowed' : 'pointer', border: 'none' }}>
          {sending ? 'Sending…' : '📨 Send Inquiry'}
        </button>
      </form>
    </div>
  );
}

function ChatWindow({ thread, messages, msgLoading, newMsg, setNewMsg, sending, onSend, bottomRef, inputRef, fmtTime, fmtDate, onBack, showBack }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
        {showBack && (
          <button onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-xl flex-shrink-0"
            style={{ color: '#60a5fa', backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer' }}>
            ←
          </button>
        )}
        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>A</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm truncate" style={{ color: '#f0f4ff' }}>{thread.subject}</p>
          <p className="text-xs" style={{ color: thread.status === 'replied' ? '#4ade80' : thread.status === 'open' ? '#fb923c' : '#64748b' }}>
            {thread.status === 'replied' ? '● Replied' : thread.status === 'open' ? '⏳ Awaiting reply' : '● Closed'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {msgLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <div className="text-3xl">💬</div>
            <p className="text-xs" style={{ color: '#374151' }}>No messages yet</p>
          </div>
        ) : messages.map((msg, i) => {
          const isUser = msg.sender === 'user';
          const showDate = i === 0 || fmtDate(messages[i - 1].created_at) !== fmtDate(msg.created_at);
          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(30,45,74,0.8)', color: '#475569' }}>
                    {fmtDate(msg.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isUser && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs mr-2 flex-shrink-0 self-end"
                    style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: '#fff' }}>A</div>
                )}
                <div className="px-3 py-2 text-sm leading-relaxed"
                  style={{
                    maxWidth: 'min(75%, 360px)',
                    background: isUser ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#1a2640',
                    color: '#fff',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    boxShadow: isUser ? '0 2px 8px rgba(37,99,235,0.25)' : '0 1px 4px rgba(0,0,0,0.3)',
                  }}>
                  <p className="whitespace-pre-wrap break-words text-sm">{msg.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>
                    {fmtTime(msg.created_at)}{isUser ? ' ✓✓' : ''}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #1e2d4a', backgroundColor: '#0a0c16', flexShrink: 0 }}>
        {thread.status === 'closed' ? (
          <p className="text-xs text-center py-1" style={{ color: '#475569' }}>
            This inquiry is closed. Start a new one to contact support.
          </p>
        ) : (
          <form onSubmit={onSend} className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(e); } }}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
              style={{
                backgroundColor: '#111827', border: '1px solid #1e2d4a', color: '#f0f4ff',
                resize: 'none', maxHeight: '100px', lineHeight: '1.5',
              }}
            />
            <button type="submit" disabled={sending || !newMsg.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: sending || !newMsg.trim() ? '#1e2d4a' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                cursor: sending || !newMsg.trim() ? 'not-allowed' : 'pointer', border: 'none',
              }}>
              {sending
                ? <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/dashboard/page.js
// ============================================================
'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [panels, setPanels]       = useState([]);
  const [balance, setBalance]     = useState(0);
  const [transactions, setTxns]   = useState([]);
  const [credModal, setCredModal] = useState(null); // { panel } | null
  const router = useRouter();

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await Promise.all([fetchPanels(), fetchWallet()]);
      } else { router.push('/login'); }
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchPanels = async () => {
    try {
      const res = await fetch('/api/panel/list');
      if (res.ok) { const d = await res.json(); setPanels(d.panels || []); }
    } catch {}
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet/balance');
      if (res.ok) { const d = await res.json(); setBalance(d.balance || 0); setTxns(d.transactions || []); }
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
          <p className="text-sm" style={{ color: '#475569' }}>Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const firstName = user?.firstname || user?.fullname?.split(' ')[0] || 'Member';
  const activePanels = panels.filter(p => p.status === 'active').length;

  const stats = [
    { label: 'Wallet Balance', value: `KSH ${parseFloat(balance).toLocaleString()}`, icon: '💳', color: '#3b82f6', href: '/wallet' },
    { label: 'Active Panels',  value: activePanels,                                   icon: '🖥️', color: '#10b981', href: '/products' },
    { label: 'Total Panels',   value: panels.length,                                  icon: '📊', color: '#8b5cf6', href: null },
    { label: 'Account',        value: 'Active',                                        icon: '✅', color: '#22c55e', href: null },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-10" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>
              Welcome back, <span style={{ color: '#3b82f6' }}>{firstName}</span> 👋
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>{user?.email}</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/wallet"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)', textDecoration: 'none' }}>
              💳 Top Up
            </Link>
            <Link href="/products"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
              🚀 New Panel
            </Link>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8 sm:mb-10">
          {stats.map(s => (
            <div key={s.label}
              className="p-4 sm:p-5 rounded-2xl transition-all"
              style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              {s.href ? (
                <Link href={s.href} style={{ textDecoration: 'none' }}><StatInner s={s} /></Link>
              ) : (
                <StatInner s={s} />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Panels list (2/3) ── */}
          <div className="lg:col-span-2 rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-base sm:text-lg" style={{ color: '#f0f4ff' }}>My Panels</h2>
                <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{panels.length} total</p>
              </div>
              <Link href="/products"
                className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                + Deploy New
              </Link>
            </div>

            {panels.length === 0 ? (
              <div className="py-12 sm:py-16 text-center">
                <div className="text-4xl sm:text-5xl mb-4">🖥️</div>
                <p className="font-semibold mb-2" style={{ color: '#f0f4ff' }}>No panels yet</p>
                <p className="text-sm mb-5" style={{ color: '#64748b' }}>Deploy your first Pterodactyl panel in minutes.</p>
                <Link href="/products"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', textDecoration: 'none' }}>
                  🚀 Deploy Now
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {panels.map(p => (
                  <div key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa' }}>
                        🖥️
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: '#f0f4ff' }}>
                          {p.ptero_username || `Panel #${p.id}`}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                          {p.package_name} · KSH {parseFloat(p.package_price || 0).toLocaleString()}
                          {p.expires_at && (
                            <span className="ml-1" style={{ color: p.is_expired ? '#f87171' : '#a78bfa' }}>
                              · {p.is_expired ? '⏱ Expired' : `⏱ Expires ${new Date(p.expires_at).toLocaleString()}`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: p.status === 'active' ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: p.status === 'active' ? '#4ade80' : '#94a3b8',
                          border: `1px solid ${p.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.25)'}`,
                        }}>
                        {p.status}
                      </span>
                      {/* 🔐 View Credentials button */}
                      <button
                        onClick={() => setCredModal({ panel: p })}
                        className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                        style={{
                          backgroundColor: 'rgba(168,85,247,0.1)',
                          color: '#c084fc',
                          border: '1px solid rgba(168,85,247,0.25)',
                          cursor: 'pointer',
                        }}>
                        🔐 Credentials
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right sidebar (1/3) ── */}
          <div className="space-y-5">
            {/* Wallet card */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>Wallet</h2>
                <Link href="/wallet" className="text-xs" style={{ color: '#3b82f6', textDecoration: 'none' }}>Manage →</Link>
              </div>
              <p className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.5rem,4vw,2rem)', color: '#3b82f6' }}>
                KSH {parseFloat(balance).toLocaleString()}
              </p>
              <p className="text-xs mb-4" style={{ color: '#475569' }}>Available balance</p>
              <Link href="/wallet"
                className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                + Deposit Funds
              </Link>
            </div>

            {/* Recent transactions */}
            <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-sm sm:text-base" style={{ color: '#f0f4ff' }}>Recent Activity</h2>
                <Link href="/wallet" className="text-xs" style={{ color: '#3b82f6', textDecoration: 'none' }}>All →</Link>
              </div>
              {transactions.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#374151' }}>No transactions yet</p>
              ) : (
                <div className="space-y-2.5">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                          style={{ backgroundColor: t.type === 'deposit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)' }}>
                          {t.type === 'deposit' ? '⬆' : '⬇'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs truncate" style={{ color: '#cbd5e1' }}>{t.description || t.type}</p>
                          <p className="text-xs" style={{ color: '#374151' }}>{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0"
                        style={{ color: t.type === 'deposit' ? '#4ade80' : '#f87171' }}>
                        {t.type === 'deposit' ? '+' : '-'}KSH {parseFloat(t.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Quick Links</p>
              <div className="space-y-2">
                {[
                  { label: 'Deploy Panel',   href: '/products', icon: '🚀' },
                  { label: 'WhatsApp Bot',   href: '/whatsapp-bot', icon: '🤖' },
                  { label: 'Contact Support',href: '/contact',  icon: '💬' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all"
                    style={{ color: '#94a3b8', backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                    <svg className="w-3.5 h-3.5 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Credentials Modal ── */}
      {credModal && (
        <CredentialsModal
          panel={credModal.panel}
          user={user}
          onClose={() => setCredModal(null)}
        />
      )}
    </div>
  );
}

function StatInner({ s }) {
  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xl sm:text-2xl">{s.icon}</span>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
      </div>
      <p className="font-extrabold text-xl sm:text-2xl mb-1" style={{ color: s.color }}>{s.value}</p>
      <p className="text-xs" style={{ color: '#64748b' }}>{s.label}</p>
    </>
  );
}

function CredentialsModal({ panel, user, onClose }) {
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [creds, setCreds]         = useState(null);
  const [error, setError]         = useState('');
  const [copied, setCopied]       = useState('');
  const inputRef = useRef(null);
  const isGoogleOnly = !user?.password_set; // Google accounts have no local password

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleReveal = async (e) => {
    e.preventDefault();
    if (!password && !isGoogleOnly) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/panel/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panel_id: panel.id, password: password || 'google-auth' }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreds(data.credentials);
      } else {
        setError(data.error || 'Failed to verify');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
              🔐
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: '#f0f4ff' }}>Panel Credentials</p>
              <p className="text-xs" style={{ color: '#475569' }}>{panel.ptero_username || `Panel #${panel.id}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ color: '#475569', border: '1px solid #1e2d4a', background: 'transparent', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="p-6">
          {!creds ? (
            /* Password gate */
            <form onSubmit={handleReveal} className="space-y-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <p className="text-xs leading-relaxed" style={{ color: '#c084fc' }}>
                  🔒 For your security, enter your account password to view the credentials for this panel.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>
                  Account Password
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your login password"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  onFocus={e => e.target.style.borderColor = '#7c3aed'}
                  onBlur={e => e.target.style.borderColor = '#1e2d4a'}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{
                  background: loading || !password ? '#1e2d4a' : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Verifying…
                  </span>
                ) : '🔓 Reveal Credentials'}
              </button>
            </form>
          ) : (
            /* Credentials view */
            <div className="space-y-3">
              <div className="p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                ✅ Identity verified — credentials revealed below.
              </div>

              {[
                { label: 'Panel URL',  value: creds.panel_url,  key: 'url',   icon: '🌐', link: creds.panel_url },
                { label: 'Username',   value: creds.username,   key: 'user',  icon: '👤' },
                { label: 'Email',      value: creds.email,      key: 'email', icon: '📧' },
                { label: 'Password',   value: creds.password,   key: 'pass',  icon: '🔑' },
              ].map(({ label, value, key, icon, link }) => (
                <div key={key} className="flex items-center justify-between gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs" style={{ color: '#475569' }}>{label}</p>
                      <p className="text-sm font-mono font-semibold truncate" style={{ color: key === 'pass' ? '#c084fc' : '#f0f4ff' }}>
                        {key === 'pass' ? '••••••••' : value}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {link && (
                      <a href={link} target="_blank" rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)', textDecoration: 'none' }}>
                        Open ↗
                      </a>
                    )}
                    <button
                      onClick={() => copy(value, key)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: copied === key ? 'rgba(34,197,94,0.15)' : 'rgba(168,85,247,0.1)',
                        color: copied === key ? '#4ade80' : '#c084fc',
                        border: `1px solid ${copied === key ? 'rgba(34,197,94,0.3)' : 'rgba(168,85,247,0.25)'}`,
                        cursor: 'pointer',
                      }}>
                      {copied === key ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}

              {/* Show real password (toggle) */}
              <PasswordReveal password={creds.password} />

              <div className="pt-1">
                <p className="text-xs text-center" style={{ color: '#374151' }}>
                  Keep these credentials safe — do not share them with anyone.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordReveal({ password }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl"
      style={{ backgroundColor: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)' }}>
      <div>
        <p className="text-xs mb-0.5" style={{ color: '#475569' }}>Password (visible)</p>
        <p className="text-sm font-mono font-bold" style={{ color: '#c084fc', letterSpacing: show ? 0 : '0.1em' }}>
          {show ? password : '••••••••••••'}
        </p>
      </div>
      <button
        onClick={() => setShow(v => !v)}
        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)', cursor: 'pointer' }}>
        {show ? '🙈 Hide' : '👁 Show'}
      </button>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/login/page.js
// ============================================================
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Welcome back</h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Sign in to your MZAZI TECH account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 py-3 rounded-xl font-semibold text-sm mb-6 transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2d4a' }} />
            <span className="px-4 text-xs" style={{ color: '#475569' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2d4a' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none"
                style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                placeholder="you@example.com"
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#1e2d4a'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm transition-all outline-none"
                style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                placeholder="Your password"
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#1e2d4a'}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Signing in...</span>
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            No account?{' '}
            <Link href="/signup" className="font-semibold hover:underline" style={{ color: '#3b82f6' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/page.js
// ============================================================
import Link from 'next/link';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

const STATS = [
  { value: '500+',   label: 'Active Panels' },
  { value: '99.9%',  label: 'Uptime' },
  { value: '24/7',   label: 'Support' },
  { value: '1,000+', label: 'Happy Clients' },
];

const FEATURES = [
  {
    icon: '🖥️',
    title: 'Pterodactyl Panels',
    desc: 'Deploy game servers instantly with full Pterodactyl panel access. Choose your resources and go live in minutes.',
    href: '/products',
    cta: 'View Plans',
  },
  {
    icon: '🤖',
    title: 'WhatsApp Bot',
    desc: 'Link your WhatsApp via Telegram bot pairing. Send /pair 254XXXXXXXXX to connect your number instantly.',
    href: '/whatsapp-bot',
    cta: 'Learn More',
  },
  {
    icon: '💳',
    title: 'Wallet System',
    desc: 'Top up via M-Pesa or card and deploy panels instantly — no repeated checkout, just one balance for everything.',
    href: '/wallet',
    cta: 'Top Up',
  },
];

function fmtCpu(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited CPU'  : `${n}% CPU`; }
function fmtRam(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited RAM'  : n >= 1024 ? `${n / 1024} GB RAM`  : `${n} MB RAM`; }
function fmtDisk(v) { const n = parseInt(v); return n === 0 ? 'Unlimited Disk' : n >= 1024 ? `${n / 1024} GB Disk` : `${n} GB`; }

async function getPackages() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`
      SELECT id, name, price, cpu, ram, disk, popular, accent
      FROM packages
      WHERE active = true
      ORDER BY sort_order ASC, id ASC
    `;
    return rows;
  } catch {
    return [];
  }
}

export default async function Home() {
  const packages = await getPackages();

  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg,rgba(7,20,40,0.98) 0%,rgba(10,10,15,1) 100%)' }}>
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,0.06) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow blobs */}
        <div className="absolute top-16 left-1/4 w-64 sm:w-96 h-64 sm:h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%)', filter: 'blur(48px)' }} />
        <div className="absolute bottom-0 right-1/4 w-56 sm:w-80 h-56 sm:h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(29,78,216,0.12) 0%,transparent 70%)', filter: 'blur(48px)' }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 sm:mb-8"
            style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-semibold" style={{ color: '#60a5fa' }}>Kenya&apos;s #1 Panel Hosting Provider</span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold mb-5 sm:mb-6 leading-tight"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 4.5rem)', color: '#f0f4ff' }}>
            Power Your{' '}
            <span style={{ background: 'linear-gradient(135deg,#60a5fa,#2563eb,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Digital World
            </span>
          </h1>

          <p className="mb-8 sm:mb-10 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed px-2" style={{ color: '#64748b' }}>
            Pterodactyl panel hosting, WhatsApp automation bots, and tech solutions — all under one roof. Powered by Mzazi Tech Inc.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4 sm:px-0">
            <Link href="/products"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white text-base transition-all"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 28px rgba(37,99,235,0.45)', textDecoration: 'none' }}>
              🚀 Deploy a Panel
            </Link>
            <Link href="/whatsapp-bot"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#f0f4ff', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              🤖 WhatsApp Bot
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 sm:mt-14 flex flex-wrap justify-center gap-4 sm:gap-8">
            {[
              { icon: '⚡', text: 'Instant Deployment' },
              { icon: '🔒', text: 'Secure & Reliable' },
              { icon: '💬', text: '24/7 Support' },
            ].map(t => (
              <div key={t.text} className="flex items-center gap-2 text-xs sm:text-sm" style={{ color: '#475569' }}>
                <span>{t.icon}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-10 sm:py-14" style={{ backgroundColor: '#0a0a0f', borderTop: '1px solid #0d1120', borderBottom: '1px solid #0d1120' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <p className="font-extrabold mb-1" style={{ fontSize: 'clamp(1.6rem,4vw,2rem)', color: '#f0f4ff' }}>{s.value}</p>
                <p className="text-xs sm:text-sm" style={{ color: '#475569' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>What We Offer</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
              Everything You Need
            </h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: '#64748b' }}>
              From game servers to WhatsApp bots — deploy, manage, and scale your digital infrastructure in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES.map(f => (
              <div key={f.title}
                className="rounded-2xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 group"
                style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-base sm:text-lg mb-2" style={{ color: '#f0f4ff' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#64748b' }}>{f.desc}</p>
                <Link href={f.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold transition-all"
                  style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  {f.cta} <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-16 sm:py-24" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#3b82f6' }}>Panel Plans</p>
            <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.6rem,4vw,2.5rem)', color: '#f0f4ff' }}>
              Simple, Honest Pricing
            </h2>
            <p className="text-sm sm:text-base" style={{ color: '#64748b' }}>Pay per month. Cancel anytime. No hidden fees.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6">
            {packages.map(pkg => (
              <div key={pkg.id}
                className="relative rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: pkg.popular ? '#0f1a35' : '#0f1629',
                  border: `1px solid ${pkg.popular ? (pkg.accent || '#2563eb') : '#1e2d4a'}`,
                  boxShadow: pkg.popular ? `0 0 30px rgba(37,99,235,0.2)` : 'none',
                }}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <p className="font-bold text-base sm:text-lg mb-1" style={{ color: '#f0f4ff' }}>{pkg.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-extrabold" style={{ fontSize: 'clamp(1.8rem,5vw,2.25rem)', color: pkg.popular ? '#60a5fa' : '#f0f4ff' }}>
                      KSH {pkg.price}
                    </span>
                    <span className="text-xs" style={{ color: '#475569' }}>/mo</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {[fmtCpu(pkg.cpu), fmtRam(pkg.ram), fmtDisk(pkg.disk), ...(pkg.expires_after_hours ? [`Auto-removed after ${pkg.expires_after_hours}h`] : [])].map(spec => (
                    <li key={spec} className="flex items-center gap-2.5 text-sm" style={{ color: '#94a3b8' }}>
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {spec}
                    </li>
                  ))}
                </ul>

                <Link href="/products"
                  className="block w-full py-2.5 rounded-xl text-sm font-bold text-center transition-all"
                  style={{
                    background: pkg.popular ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'transparent',
                    color: pkg.popular ? '#fff' : '#60a5fa',
                    border: pkg.popular ? 'none' : '1px solid rgba(37,99,235,0.35)',
                    textDecoration: 'none',
                  }}>
                  {pkg.popular ? 'Get Started' : 'Choose Plan'}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-xs mt-8" style={{ color: '#374151' }}>
            🛡️ 2-week panel replacement warranty included on all plans
          </p>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="py-16 sm:py-20"
        style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.15) 0%,rgba(10,10,15,1) 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-extrabold mb-4" style={{ fontSize: 'clamp(1.5rem,4vw,2.2rem)', color: '#f0f4ff' }}>
            Ready to get started?
          </h2>
          <p className="mb-8 text-sm sm:text-base" style={{ color: '#64748b' }}>
            Create your free account, top up your wallet, and deploy your first panel in under 5 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white text-base"
              style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow: '0 0 28px rgba(37,99,235,0.4)', textDecoration: 'none' }}>
              Create Free Account
            </Link>
            <Link href="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-sm"
              style={{ color: '#94a3b8', border: '1px solid #1e2d4a', textDecoration: 'none' }}>
              Talk to Support
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/payment/callback/page.js
// ============================================================
'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Loading component while Suspense resolves
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-gray-800">Loading payment details...</h2>
        <p className="text-gray-600 mt-2">Please wait</p>
      </div>
    </div>
  );
}

// Main component with useSearchParams
function PaymentCallbackContent() {
  const [status, setStatus] = useState('verifying');
  const [credentials, setCredentials] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');

  useEffect(() => {
    if (reference) {
      verifyPayment();
    }
  }, [reference]);

  const verifyPayment = async () => {
    try {
      const response = await fetch(`/api/payment/verify?reference=${reference}`);
      const data = await response.json();

      if (data.status) {
        setStatus('success');
        setCredentials(data.credentials);
      } else {
        setStatus('failed');
        setError(data.message || 'Payment verification failed');
      }
    } catch (error) {
      setStatus('error');
      setError('An error occurred while verifying payment');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800">Verifying Payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  if (status === 'success' && credentials) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-gray-600 mt-2">Your Pterodactyl panel has been provisioned</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Your Panel Credentials</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <label className="text-sm text-gray-600 font-medium">Panel Link</label>
                <p className="text-lg font-mono text-blue-600 break-all">
                  {credentials.panel_link}
                </p>
              </div>

              <div className="bg-white p-4 rounded border">
                <label className="text-sm text-gray-600 font-medium">Username</label>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-mono break-all">{credentials.username}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(credentials.username)}
                    className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-white p-4 rounded border">
                <label className="text-sm text-gray-600 font-medium">Password</label>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-mono break-all">{credentials.password}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(credentials.password)}
                    className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 font-medium">⚠️ Important</p>
            <p className="text-yellow-700 mt-1">
              Please save these credentials securely. For security reasons, 
              the password will not be displayed again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.open(credentials.panel_link, '_blank')}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Go to Panel
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'failed' || status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/products'}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/contact'}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Main export wrapped in Suspense
export default function PaymentCallback() {
  return (
    <Suspense fallback={<LoadingState />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/products/page.js
// ============================================================
'use client';
import { useState, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function fmtCpu(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited CPU'  : `${n}% CPU`; }
function fmtRam(v)  { const n = parseInt(v); return n === 0 ? 'Unlimited RAM'  : n >= 1024 ? `${n / 1024} GB RAM`  : `${n} MB RAM`; }
function fmtDisk(v) { const n = parseInt(v); return n === 0 ? 'Unlimited Disk' : n >= 1024 ? `${n / 1024} GB Disk` : `${n} MB Disk`; }

const STEPS = ['Select Plan', 'Configure', 'Review', 'Done'];

export default function ProductsPage() {
  const [user, setUser]         = useState(null);
  const [balance, setBalance]   = useState(0);
  const [loading, setLoading]   = useState(true);
  const [packages, setPackages] = useState([]);
  const [pkg, setPkg]           = useState(null);
  const [nests, setNests]       = useState([]);
  const [eggs, setEggs]         = useState([]);
  const [loadingNests, setLN]   = useState(false);
  const [loadingEggs, setLE]    = useState(false);
  const [form, setForm]         = useState({ ptero_username: '', ptero_password: '', firstname: '', lastname: '', nest_id: '', egg_id: '' });
  const [step, setStep]         = useState('select');
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const router = useRouter();

  useEffect(() => { init(); }, []);

  const init = async () => {
    const [authRes, pkgRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/packages', { cache: 'no-store' }),
    ]);
    if (authRes.ok) {
      const d = await authRes.json(); setUser(d.user);
      const wr = await fetch('/api/wallet/balance');
      if (wr.ok) { const wd = await wr.json(); setBalance(wd.balance || 0); }
    }
    if (pkgRes.ok) { const pd = await pkgRes.json(); setPackages(pd.packages || []); }
    setLoading(false);
  };

  const handleSelectPkg = async (p) => {
    if (!user) { router.push('/login'); return; }
    setPkg(p); setStep('configure'); setError('');
    setLN(true);
    try {
      const res = await fetch('/api/panel/nests');
      if (res.ok) { const d = await res.json(); setNests(d.nests || []); }
    } catch {}
    setLN(false);
  };

  const handleNestChange = async (nestId) => {
    setForm(f => ({ ...f, nest_id: nestId, egg_id: '' }));
    setEggs([]);
    if (!nestId) return;
    setLE(true);
    try {
      const res = await fetch(`/api/panel/eggs?nest_id=${nestId}`);
      if (res.ok) { const d = await res.json(); setEggs(d.eggs || []); }
    } catch {}
    setLE(false);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    if (!form.ptero_username || !form.ptero_password || !form.firstname || !form.lastname || !form.nest_id || !form.egg_id) {
      setError('All fields are required'); return;
    }
    if (balance < pkg.price) {
      setError(`Insufficient balance. You need KSH ${pkg.price} but have KSH ${parseFloat(balance).toFixed(2)}. Please top up your wallet.`);
      return;
    }
    setError(''); setStep('confirm');
  };

  const handleCreate = async () => {
    setStep('creating'); setError('');
    try {
      const res = await fetch('/api/panel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: pkg.id, ...form }),
      });
      const data = await res.json();
      if (res.ok) { setResult(data.panel); setStep('done'); }
      else { setError(data.error || 'Failed to create panel'); setStep('confirm'); }
    } catch {
      setError('Network error. Please try again.'); setStep('confirm');
    }
  };

  const reset = () => { setPkg(null); setStep('select'); setForm({ ptero_username:'',ptero_password:'',firstname:'',lastname:'',nest_id:'',egg_id:'' }); setResult(null); setError(''); setNests([]); setEggs([]); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    );
  }

  const stepIndex = { select: 0, configure: 1, confirm: 2, creating: 2, done: 3 }[step] ?? 0;

  return (
    <div className="min-h-screen py-8 sm:py-12" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* ── Page header ── */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: '#f0f4ff' }}>Deploy a Panel</h1>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Choose a plan, configure your server, and go live in minutes.
          </p>
          {user && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#60a5fa' }}>
              💳 Wallet: <strong>KSH {parseFloat(balance).toLocaleString()}</strong>
              {balance < 50 && (
                <Link href="/wallet" className="ml-2 underline text-xs" style={{ color: '#f87171', textDecoration: 'underline' }}>Top up →</Link>
              )}
            </div>
          )}
        </div>

        {/* ── Step indicator ── */}
        {step !== 'select' && (
          <div className="flex items-center gap-0 mb-8 sm:mb-10 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <Fragment key={s}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: i < stepIndex ? '#22c55e' : i === stepIndex ? '#2563eb' : '#1e2d4a',
                      color: i <= stepIndex ? '#fff' : '#475569',
                    }}>
                    {i < stepIndex ? '✓' : i + 1}
                  </div>
                  <p className="text-xs mt-1.5 whitespace-nowrap"
                    style={{ color: i === stepIndex ? '#f0f4ff' : '#475569', fontWeight: i === stepIndex ? 600 : 400 }}>
                    {s}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-2 sm:mx-3 min-w-4"
                    style={{ backgroundColor: i < stepIndex ? '#22c55e' : '#1e2d4a', marginBottom: '1.25rem' }} />
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
            {error}
            {error.includes('Insufficient') && (
              <Link href="/wallet" className="ml-2 underline font-semibold" style={{ color: '#fbbf24' }}>Top up wallet →</Link>
            )}
          </div>
        )}

        {/* ════ STEP: select ════ */}
        {step === 'select' && (
          <>
            {!user && (
              <div className="mb-6 p-4 rounded-xl text-sm flex flex-col sm:flex-row items-start sm:items-center gap-3"
                style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', color: '#fcd34d' }}>
                <span>⚠️ You need to be logged in to deploy a panel.</span>
                <Link href="/login" className="font-bold underline flex-shrink-0" style={{ color: '#fbbf24' }}>Log in →</Link>
              </div>
            )}
            {packages.length === 0 ? (
              <div className="text-center py-16" style={{ color: '#475569' }}>No packages available at the moment. Please check back soon.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                {packages.map(p => (
                  <div key={p.id}
                    className="relative rounded-2xl p-5 sm:p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    style={{
                      backgroundColor: p.popular ? '#0f1a35' : '#0f1629',
                      border: `1px solid ${p.popular ? p.accent : '#1e2d4a'}`,
                      boxShadow: p.popular ? `0 0 30px ${p.accent}30` : 'none',
                    }}
                    onClick={() => handleSelectPkg(p)}>
                    {p.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold text-white"
                          style={{ background: `linear-gradient(135deg,${p.accent},${p.accent}cc)` }}>
                          Most Popular
                        </span>
                      </div>
                    )}
                    <p className="font-bold text-base mb-1" style={{ color: '#f0f4ff' }}>{p.name}</p>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="font-extrabold text-3xl" style={{ color: p.popular ? p.accent : '#f0f4ff' }}>KSH {parseFloat(p.price).toLocaleString()}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>/mo</span>
                    </div>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: '#64748b' }}>{p.description}</p>
                    <ul className="space-y-2 mb-5 flex-1">
                      {[fmtCpu(p.cpu), fmtRam(p.ram), fmtDisk(p.disk), ...(p.expires_after_hours ? [`Auto-removed after ${p.expires_after_hours}h`] : [])].map(spec => (
                        <li key={spec} className="flex items-center gap-2 text-sm" style={{ color: '#94a3b8' }}>
                          <svg className="w-4 h-4 flex-shrink-0" style={{ color: p.accent || '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {spec}
                        </li>
                      ))}
                    </ul>
                    <button
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: p.popular ? `linear-gradient(135deg,${p.accent},${p.accent}cc)` : '#1e2d4a' }}
                      onClick={e => { e.stopPropagation(); handleSelectPkg(p); }}>
                      {p.popular ? '⚡ Get Started' : 'Choose Plan'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ════ STEP: configure ════ */}
        {step === 'configure' && pkg && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* Form */}
            <div className="lg:col-span-2 rounded-2xl p-5 sm:p-7" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
              <h2 className="font-bold text-lg mb-5" style={{ color: '#f0f4ff' }}>Configure Your Server</h2>
              <form onSubmit={handleConfirm} className="space-y-4">
                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'firstname', label: 'First Name', placeholder: 'John' },
                    { key: 'lastname',  label: 'Last Name',  placeholder: 'Doe' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{f.label}</label>
                      <input type="text" value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} required
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                        onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#1e2d4a'} />
                    </div>
                  ))}
                </div>

                {/* Username + Password */}
                {[
                  { key: 'ptero_username', label: 'Panel Username', placeholder: 'Your Pterodactyl username', type: 'text' },
                  { key: 'ptero_password', label: 'Panel Password',  placeholder: 'Min. 8 characters',        type: 'password' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>{f.label}</label>
                    <input type={f.type} value={form[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} required
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                      onFocus={e => e.target.style.borderColor='#2563eb'} onBlur={e => e.target.style.borderColor='#1e2d4a'} />
                  </div>
                ))}

                {/* Nest selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Server Type (Nest)</label>
                  <select value={form.nest_id} onChange={e => handleNestChange(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: form.nest_id ? '#f0f4ff' : '#475569' }}>
                    <option value="">{loadingNests ? 'Loading nests…' : '— Select a nest —'}</option>
                    {nests.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>

                {/* Egg selector */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#475569' }}>Server Software (Egg)</label>
                  <select value={form.egg_id} onChange={e => setForm(f => ({ ...f, egg_id: e.target.value }))} required disabled={!form.nest_id}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: form.egg_id ? '#f0f4ff' : '#475569', opacity: !form.nest_id ? 0.5 : 1 }}>
                    <option value="">{loadingEggs ? 'Loading eggs…' : !form.nest_id ? '— Select a nest first —' : '— Select software —'}</option>
                    {eggs.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button type="button" onClick={reset}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                    ← Back
                  </button>
                  <button type="submit"
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                    Review Order →
                  </button>
                </div>
              </form>
            </div>

            {/* Order summary */}
            <div>
              <div className="rounded-2xl p-5 sm:p-6 sticky top-20" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>Order Summary</p>
                <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #1e2d4a' }}>
                  <div>
                    <p className="font-bold" style={{ color: '#f0f4ff' }}>{pkg.name} Plan</p>
                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Monthly subscription</p>
                  </div>
                  <p className="font-extrabold text-xl" style={{ color: '#3b82f6' }}>KSH {parseFloat(pkg.price).toLocaleString()}</p>
                </div>
                {[fmtCpu(pkg.cpu), fmtRam(pkg.ram), fmtDisk(pkg.disk)].map(s => (
                  <div key={s} className="flex items-center gap-2 py-1.5 text-sm" style={{ color: '#64748b' }}>
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {s}
                  </div>
                ))}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1e2d4a' }}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#475569' }}>
                    <span>Your balance</span>
                    <span style={{ color: balance >= pkg.price ? '#4ade80' : '#f87171' }}>KSH {parseFloat(balance).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: '#475569' }}>
                    <span>After purchase</span>
                    <span style={{ color: '#94a3b8' }}>KSH {Math.max(0, balance - pkg.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════ STEP: confirm ════ */}
        {step === 'confirm' && pkg && (
          <div className="max-w-lg mx-auto rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <h2 className="font-bold text-xl mb-6" style={{ color: '#f0f4ff' }}>Confirm Order</h2>
            {[
              { label: 'Plan',      value: `${pkg.name} — KSH ${parseFloat(pkg.price).toLocaleString()}/mo` },
              { label: 'Resources', value: `${fmtCpu(pkg.cpu)} · ${fmtRam(pkg.ram)} · ${fmtDisk(pkg.disk)}` },
              { label: 'Username',  value: form.ptero_username },
              { label: 'Name',      value: `${form.firstname} ${form.lastname}` },
              { label: 'Nest',      value: nests.find(n => String(n.id) === String(form.nest_id))?.name || form.nest_id },
              { label: 'Egg',       value: eggs.find(e => String(e.id) === String(form.egg_id))?.name || form.egg_id },
            ].map(r => (
              <div key={r.label} className="flex justify-between py-3 text-sm" style={{ borderBottom: '1px solid #1e2d4a' }}>
                <span style={{ color: '#64748b' }}>{r.label}</span>
                <span className="font-semibold text-right ml-4" style={{ color: '#f0f4ff', wordBreak: 'break-all' }}>{r.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 text-base font-bold" style={{ borderBottom: '1px solid #1e2d4a' }}>
              <span style={{ color: '#94a3b8' }}>Total Charge</span>
              <span style={{ color: '#3b82f6' }}>KSH {parseFloat(pkg.price).toLocaleString()}</span>
            </div>
            <p className="text-xs mt-4 mb-6" style={{ color: '#475569' }}>
              KSH {parseFloat(pkg.price).toLocaleString()} will be deducted from your wallet. Balance after: KSH {Math.max(0, balance - pkg.price).toLocaleString()}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setStep('configure')}
                className="flex-1 py-3 rounded-xl text-sm font-semibold"
                style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                ← Edit
              </button>
              <button onClick={handleCreate}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
                ✅ Confirm & Deploy
              </button>
            </div>
          </div>
        )}

        {/* ════ STEP: creating ════ */}
        {step === 'creating' && (
          <div className="text-center py-16 sm:py-24">
            <div className="w-14 h-14 rounded-full border-2 animate-spin mx-auto mb-6"
              style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
            <p className="font-bold text-lg mb-2" style={{ color: '#f0f4ff' }}>Deploying your panel…</p>
            <p className="text-sm" style={{ color: '#64748b' }}>This takes about 30 seconds. Please wait.</p>
          </div>
        )}

        {/* ════ STEP: done ════ */}
        {step === 'done' && result && (
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-6 sm:p-8" style={{ backgroundColor: '#0f1629', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 40px rgba(34,197,94,0.1)' }}>
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🎉</div>
                <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#f0f4ff' }}>Panel Deployed!</h2>
                <p className="text-sm" style={{ color: '#64748b' }}>Your server is live. Save these credentials — you will need them to log in.</p>
              </div>

              {/* Credentials box */}
              <div className="rounded-xl p-4 mb-4 text-left space-y-3" style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: '#475569' }}>Login Credentials</p>
                {[
                  { label: '🌐 Panel URL',  value: result.panel_url || 'https://public.mzazi.shop', link: result.panel_url || 'https://public.mzazi.shop' },
                  { label: '👤 Username',   value: result.username  || form.ptero_username },
                  { label: '🔑 Password',   value: result.password  || form.ptero_password },
                  { label: '📦 Plan',       value: result.package   || pkg?.name },
                  { label: '🖥️ Server ID',  value: result.ptero_server_id ? String(result.ptero_server_id) : '—' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between gap-3 text-sm py-1" style={{ borderBottom: '1px solid #1e2d4a' }}>
                    <span className="flex-shrink-0" style={{ color: '#64748b' }}>{r.label}</span>
                    {r.link
                      ? <a href={r.link} target="_blank" rel="noopener noreferrer" className="font-semibold truncate" style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all' }}>{r.value}</a>
                      : <span className="font-mono font-semibold text-right" style={{ color: '#f0f4ff', wordBreak: 'break-all' }}>{r.value}</span>
                    }
                  </div>
                ))}
              </div>

              {/* Expiry notice */}
              {result.expires_at && (
                <div className="rounded-xl px-4 py-3 mb-4 text-sm flex items-start gap-2" style={{ backgroundColor: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                  <span className="flex-shrink-0">⏱</span>
                  <span>This server will be <strong>automatically removed</strong> on {new Date(result.expires_at).toLocaleString()}. Make sure to back up your data before then.</span>
                </div>
              )}

              {/* Warning to save creds */}
              <div className="rounded-xl px-4 py-3 mb-5 text-xs" style={{ backgroundColor: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }}>
                ⚠️ <strong>Save your password now.</strong> It is shown only once and cannot be recovered from this page.
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a href={result.panel_url || 'https://public.mzazi.shop'}
                  target="_blank" rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', textDecoration: 'none' }}>
                  🚀 Open Panel →
                </a>
                <button onClick={reset}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ color: '#94a3b8', border: '1px solid #1e2d4a' }}>
                  Deploy Another
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/signup/page.js
// ============================================================
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Account created! Redirecting...');
        setTimeout(() => router.push('/login'), 1500);
      } else {
        setError(data.error || 'Signup failed. Try again.' + (data.detail ? `: ${data.detail}` : ''));
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = '/api/auth/google';
  };

  const fields = [
    { name: 'firstname', label: 'First Name', type: 'text', placeholder: 'John', half: true },
    { name: 'lastname', label: 'Last Name', type: 'text', placeholder: 'Doe', half: true },
    { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com', half: false },
    { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters', half: false },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password', half: false },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold" style={{ color: '#f0f4ff' }}>Create Account</h2>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Join MZAZI TECH — it's free</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80' }}>
              {success}
            </div>
          )}

          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center space-x-3 py-3 rounded-xl font-semibold text-sm mb-6 transition-all"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          <div className="flex items-center mb-6">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2d4a' }} />
            <span className="px-4 text-xs" style={{ color: '#475569' }}>or register with email</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1e2d4a' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>First Name</label>
                <input type="text" name="firstname" required value={formData.firstname} onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="John"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Last Name</label>
                <input type="text" name="lastname" required value={formData.lastname} onChange={handleChange}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder="Doe"
                  style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
              </div>
            </div>

            <div className="space-y-4 mb-6">
              {[
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 6 characters' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
              ].map(f => (
                <div key={f.name}>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>{f.label}</label>
                  <input type={f.type} name={f.name} required value={formData[f.name]} onChange={handleChange}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none" placeholder={f.placeholder}
                    style={{ backgroundColor: '#0d1117', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'} onBlur={e => e.target.style.borderColor = '#1e2d4a'} />
                </div>
              ))}
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all"
              style={{ background: loading ? '#1e2d4a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span>Creating account...</span>
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#64748b' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: '#3b82f6' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/wallet/page.js
// ============================================================
'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// ─── Receipt printer (no library needed) ────────────────────────────────────
function downloadReceipt(t, userEmail, balance) {
  const date = new Date(t.created_at);
  const dateStr = date.toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const isDebit = t.type !== 'deposit';
  const sign = isDebit ? '-' : '+';
  const color = isDebit ? '#e53e3e' : '#38a169';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Mzazi Tech Receipt #${t.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Courier+Prime:wght@400;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#f5f5f5; display:flex; justify-content:center; align-items:flex-start; padding:30px; font-family:'Inter',sans-serif; }
    .receipt {
      background:#fff;
      width:380px;
      border-radius:12px;
      box-shadow:0 4px 24px rgba(0,0,0,0.15);
      overflow:hidden;
      position:relative;
    }
    /* torn-edge top */
    .receipt::before {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 14px, #f5f5f5 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
    }
    /* torn-edge bottom */
    .receipt::after {
      content:'';
      display:block;
      height:14px;
      background: radial-gradient(circle at 10px 0px, #f5f5f5 10px, transparent 0) repeat-x, #fff;
      background-size:20px 14px, 100% 100%;
      transform:rotate(180deg);
    }
    .header {
      background: linear-gradient(135deg, #1a1f3a 0%, #1e3a8a 100%);
      color:#fff;
      text-align:center;
      padding:28px 24px 20px;
    }
    .logo { font-size:22px; font-weight:800; letter-spacing:1px; margin-bottom:4px; }
    .logo span { color:#60a5fa; }
    .tagline { font-size:10px; color:#93c5fd; letter-spacing:2px; text-transform:uppercase; }
    .status-badge {
      display:inline-block;
      margin-top:14px;
      padding:5px 18px;
      border-radius:20px;
      font-size:11px;
      font-weight:700;
      letter-spacing:1px;
      text-transform:uppercase;
      background:${t.status === 'success' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'};
      color:${t.status === 'success' ? '#6ee7b7' : '#fcd34d'};
      border:1px solid ${t.status === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(251,191,36,0.4)'};
    }
    .body { padding:24px; }
    .amount-section { text-align:center; padding:20px 0 24px; border-bottom:1px dashed #e2e8f0; }
    .amount-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:6px; }
    .amount { font-size:38px; font-weight:800; color:${color}; letter-spacing:-1px; }
    .currency { font-size:18px; font-weight:600; }
    .rows { padding:20px 0; border-bottom:1px dashed #e2e8f0; }
    .row { display:flex; justify-content:space-between; align-items:flex-start; padding:7px 0; font-size:13px; }
    .row-label { color:#64748b; font-size:12px; }
    .row-value { color:#1e293b; font-weight:600; text-align:right; max-width:200px; word-break:break-all; }
    .ref { font-family:'Courier Prime',monospace; font-size:11px; color:#3b82f6; }
    .warranty {
      margin:16px 0 0;
      padding:12px 14px;
      background:#eff6ff;
      border-radius:8px;
      border-left:3px solid #3b82f6;
      font-size:11px;
      color:#1e40af;
      line-height:1.6;
    }
    .warranty strong { display:block; margin-bottom:2px; font-size:12px; }
    .footer { text-align:center; padding:16px 24px 20px; }
    .footer p { font-size:10px; color:#94a3b8; line-height:1.7; }
    .footer a { color:#3b82f6; text-decoration:none; }
    .barcode {
      font-family:'Courier Prime',monospace;
      font-size:9px;
      color:#cbd5e1;
      letter-spacing:4px;
      margin-top:8px;
      word-break:break-all;
    }
    @media print {
      body { background:#fff; padding:0; }
      .receipt { box-shadow:none; }
    }
  </style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <div class="logo">MZAZI <span>TECH</span></div>
    <div class="tagline">Official Transaction Receipt</div>
    <div class="status-badge">${t.status}</div>
  </div>
  <div class="body">
    <div class="amount-section">
      <div class="amount-label">Transaction Amount</div>
      <div class="amount"><span class="currency">KSH </span>${sign}${parseFloat(t.amount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="rows">
      <div class="row"><span class="row-label">Receipt No.</span><span class="row-value ref">#MZAZI-${String(t.id).padStart(6,'0')}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${dateStr}</span></div>
      <div class="row"><span class="row-label">Time</span><span class="row-value">${timeStr}</span></div>
      <div class="row"><span class="row-label">Description</span><span class="row-value">${t.description || t.type}</span></div>
      <div class="row"><span class="row-label">Transaction Type</span><span class="row-value" style="text-transform:capitalize">${t.type}</span></div>
      <div class="row"><span class="row-label">Account</span><span class="row-value">${userEmail || '—'}</span></div>
      ${t.reference ? `<div class="row"><span class="row-label">Reference</span><span class="row-value ref">${t.reference}</span></div>` : ''}
      <div class="row"><span class="row-label">Wallet Balance After</span><span class="row-value">KSH ${parseFloat(balance).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</span></div>
    </div>
    <div class="warranty">
      <strong>🛡️ Panel Warranty Policy</strong>
      Pterodactyl panel replacement warranty is valid for <strong>2 weeks</strong> from the date of purchase. Contact support within this period for a free replacement.
    </div>
  </div>
  <div class="footer">
    <p>Thank you for using Mzazi Tech Inc.<br/>
    Support: <a href="https://t.me/mzazitech">t.me/mzazitech</a> &nbsp;|&nbsp; <a href="https://official.mzazi.shop">official.mzazi.shop</a></p>
    <div class="barcode">||||| ${t.reference || `TX${t.id}`} |||||</div>
  </div>
</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=480,height=720,scrollbars=yes');
  if (!win) {
    // fallback: direct download
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mzazi-Receipt-${t.id}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// ─── Main wallet component ───────────────────────────────────────────────────
function WalletInner() {
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [redeemingVoucher, setRedeemingVoucher] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [message, setMessage] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const amount = searchParams.get('amount');
    if (success === 'credited') {
      setMessage({ type: 'success', text: `KSH ${parseFloat(amount).toLocaleString()} has been added to your wallet!` });
    } else if (success === 'already_credited') {
      setMessage({ type: 'info', text: 'Payment already credited to your wallet.' });
    } else if (error) {
      setMessage({ type: 'error', text: 'Payment failed or was cancelled. Please try again.' });
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) { router.push('/login'); return; }
      const data = await res.json();
      setUser(data.user);
      await fetchWallet();
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchWallet = async () => {
    const res = await fetch('/api/wallet/balance');
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount < 10) {
      setMessage({ type: 'error', text: 'Minimum deposit is KSH 10' });
      return;
    }
    setDepositing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initialize payment' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setDepositing(false);
    }
  };

  const handleRedeemVoucher = async (e) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setRedeemingVoucher(true);
    setMessage(null);
    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        setVoucherCode('');
        setShowVoucherForm(false);
        setBalance(data.newBalance);
        await fetchWallet();
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid voucher code' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setRedeemingVoucher(false);
    }
  };

  const quickAmounts = [50, 100, 200, 500, 1000];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="max-w-4xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>My Wallet</h1>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>Deposit funds and use them to deploy panels instantly</p>
          </div>
          {/* Telegram support button */}
          <a
            href="https://t.me/mzazitech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #0088cc, #006da8)',
              color: '#fff',
              border: '1px solid rgba(0,136,204,0.4)',
              boxShadow: '0 0 12px rgba(0,136,204,0.25)',
              textDecoration: 'none',
            }}
          >
            {/* Telegram icon */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram Support
          </a>
        </div>

        {/* ── Alert ── */}
        {message && (
          <div className="mb-6 p-4 rounded-xl text-sm" style={{
            backgroundColor: message.type === 'success' ? 'rgba(34,197,94,0.1)' : message.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
            color: message.type === 'success' ? '#4ade80' : message.type === 'error' ? '#f87171' : '#60a5fa',
          }}>
            {message.text}
          </div>
        )}

        {/* ── Warranty Notice ── */}
        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl text-sm" style={{
          backgroundColor: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
        }}>
          <span className="text-lg">🛡️</span>
          <p style={{ color: '#93c5fd', lineHeight: 1.6 }}>
            <span className="font-semibold" style={{ color: '#60a5fa' }}>Panel Warranty: </span>
            Pterodactyl panel replacement warranty is valid for <strong>2 weeks</strong> from purchase date.
            Contact <a href="https://t.me/mzazitech" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>support</a> within this period for a free replacement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Balance Card ── */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Available Balance</p>
            <p className="text-4xl font-extrabold" style={{ color: '#3b82f6' }}>
              KSH {parseFloat(balance).toLocaleString()}
            </p>
            {user && (
              <p className="mt-3 text-sm" style={{ color: '#64748b' }}>
                Account: <span style={{ color: '#94a3b8' }}>{user.email}</span>
              </p>
            )}
          </div>

          {/* ── Deposit Form ── */}
          <div className="rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#475569' }}>Deposit Funds</p>
            <form onSubmit={handleDeposit}>
              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ color: '#64748b' }}>Amount (KSH)</label>
                <input
                  type="number"
                  min="10"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {quickAmounts.map(amt => (
                  <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))}
                    className="text-xs px-3 py-1 rounded-lg transition-colors"
                    style={{
                      backgroundColor: depositAmount === String(amt) ? '#2563eb' : '#1e2d4a',
                      color: depositAmount === String(amt) ? '#fff' : '#94a3b8',
                      border: '1px solid #1e2d4a',
                    }}>
                    KSH {amt}
                  </button>
                ))}
              </div>
              <button type="submit" disabled={depositing}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
                style={{ backgroundColor: '#2563eb', color: '#fff', opacity: depositing ? 0.7 : 1 }}>
                {depositing ? 'Redirecting to Paystack...' : 'Deposit via Paystack'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Voucher Top-Up ── */}
        <div className="mt-6 rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Top Up with Voucher</p>
              <p className="text-xs mt-1" style={{ color: '#374151' }}>Enter a 6-character code given by admin to credit your wallet instantly</p>
            </div>
            <button
              onClick={() => { setShowVoucherForm(v => !v); setMessage(null); setVoucherCode(''); }}
              className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff' }}
            >
              {showVoucherForm ? 'Cancel' : 'Top Up with Voucher'}
            </button>
          </div>
          {showVoucherForm && (
            <form onSubmit={handleRedeemVoucher} className="mt-5 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs mb-1.5" style={{ color: '#64748b' }}>Voucher Code</label>
                <input
                  type="text"
                  value={voucherCode}
                  onChange={e => setVoucherCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                  placeholder="Enter 6-character code..."
                  maxLength={6}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono tracking-widest"
                  style={{ backgroundColor: '#0a0a0f', border: '1px solid #1e2d4a', color: '#f0f4ff' }}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={redeemingVoucher || voucherCode.length !== 6}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff',
                  opacity: (redeemingVoucher || voucherCode.length !== 6) ? 0.5 : 1,
                  cursor: (redeemingVoucher || voucherCode.length !== 6) ? 'not-allowed' : 'pointer',
                }}
              >
                {redeemingVoucher ? 'Activating...' : 'Activate'}
              </button>
            </form>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div className="mt-8 rounded-2xl p-6" style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Transaction History</p>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#1e2d4a', color: '#64748b' }}>
              {transactions.length} record{transactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">📋</div>
              <p style={{ color: '#64748b' }}>No transactions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e2d4a' }}>
                    {['Date', 'Description', 'Type', 'Amount', 'Status', 'Receipt'].map(h => (
                      <th key={h} className="text-left pb-3 pr-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(30,45,74,0.5)' }}>
                      <td className="py-3 pr-3 text-xs whitespace-nowrap" style={{ color: '#64748b' }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3" style={{ color: '#cbd5e1' }}>{t.description || t.type}</td>
                      <td className="py-3 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: t.type === 'deposit' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                          color: t.type === 'deposit' ? '#4ade80' : '#f87171',
                          border: `1px solid ${t.type === 'deposit' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        }}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-semibold whitespace-nowrap" style={{ color: t.type === 'deposit' ? '#4ade80' : '#f87171' }}>
                        {t.type === 'deposit' ? '+' : '-'}KSH {parseFloat(t.amount).toLocaleString()}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{
                          backgroundColor: t.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)',
                          color: t.status === 'success' ? '#4ade80' : '#facc15',
                        }}>
                          {t.status}
                        </span>
                      </td>
                      {/* ── Download Receipt button ── */}
                      <td className="py-3">
                        <button
                          onClick={() => downloadReceipt(t, user?.email, balance)}
                          title="Download receipt"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{
                            backgroundColor: 'rgba(37,99,235,0.12)',
                            color: '#60a5fa',
                            border: '1px solid rgba(37,99,235,0.25)',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.25)';
                            e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.12)';
                            e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)';
                          }}
                        >
                          {/* printer icon */}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                          </svg>
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Bottom support strip ── */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl"
          style={{ backgroundColor: '#0f1629', border: '1px solid #1e2d4a' }}>
          <p className="text-xs" style={{ color: '#475569' }}>
            Need help with a transaction or a panel issue?
          </p>
          <a
            href="https://t.me/mzazitech"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all"
            style={{
              background: 'linear-gradient(135deg, #0088cc, #006da8)',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 0 10px rgba(0,136,204,0.2)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Contact Support on Telegram
          </a>
        </div>

      </div>
    </div>
  );
}

// Outer page wraps WalletInner in Suspense (required for useSearchParams in Next.js 14)
export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: '#1e2d4a', borderTopColor: '#3b82f6' }} />
      </div>
    }>
      <WalletInner />
    </Suspense>
  );
}


// ============================================================
// FILE: Samsung-xmd-main/app/whatsapp-bot/page.js
// ============================================================
import Link from 'next/link';

const steps = [
  {
    step: '01',
    title: 'Open the Telegram Bot',
    desc: 'Click the button below to open our official Telegram bot. Search @mrsmzazixdbot on Telegram or click the link.',
    icon: '📱',
    action: { label: 'Open @mrsmzazixdbot', href: 'https://t.me/mrsmzazixdbot' },
  },
  {
    step: '02',
    title: 'Start the Bot',
    desc: 'Send /start to the bot to initialize. The bot will respond with a welcome message and available commands.',
    icon: '▶️',
    code: '/start',
  },
  {
    step: '03',
    title: 'Pair Your WhatsApp',
    desc: 'Use the /pair command followed by your Kenyan phone number in international format (254XXXXXXXXX) to generate a pairing code.',
    icon: '🔗',
    code: '/pair 254712345678',
  },
  {
    step: '04',
    title: 'Enter the Code in WhatsApp',
    desc: 'Open WhatsApp → Linked Devices → Link a Device → Link with Phone Number. Enter the pairing code the bot sends you.',
    icon: '✅',
  },
];

const features = [
  { icon: '⚡', title: 'Instant Pairing', desc: 'Link your WhatsApp number in seconds via our Telegram bot — no QR code scanning needed.' },
  { icon: '🤖', title: 'Bot Commands', desc: 'Manage your bot, send broadcasts, auto-reply messages, and run custom automation workflows.' },
  { icon: '🔒', title: 'Secure Connection', desc: 'Your WhatsApp is connected securely. No passwords are stored — only a session token.' },
  { icon: '📊', title: '24/7 Uptime', desc: 'Your bot runs on our high-availability infrastructure, ensuring it\'s always online.' },
  { icon: '🌍', title: 'Kenya Numbers', desc: 'Optimized for Kenyan phone numbers (254XXXXXXXXX). Works on all Safaricom, Airtel & Telkom numbers.' },
  { icon: '💬', title: 'Multi-Group Support', desc: 'Manage multiple WhatsApp groups and broadcast lists from one dashboard.' },
];

export default function WhatsAppBotPage() {
  return (
    <div style={{ backgroundColor: '#0a0a0f' }}>
      {/* Hero */}
      <section className="relative overflow-hidden py-20" style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #071428 50%, #0a0a0f 100%)' }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-6" style={{ backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <span className="text-green-400 text-lg">●</span>
            <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>WhatsApp Bot Service — Active</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold mb-6" style={{ color: '#f0f4ff' }}>
            Connect Your
            <br />
            <span style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              WhatsApp Bot
            </span>
          </h1>

          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#64748b' }}>
            Link your WhatsApp number through our Telegram bot in under 2 minutes. No technical skills needed — just one simple command.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://t.me/mrsmzazixdbot" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl font-bold text-white inline-flex items-center space-x-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
              </svg>
              <span>Open @mrsmzazixdbot on Telegram</span>
            </a>
          </div>
        </div>
      </section>

      {/* How to pair */}
      <section className="py-20" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: '#f0f4ff' }}>How to Link Your WhatsApp</h2>
            <p style={{ color: '#64748b' }}>Follow these 4 simple steps using Telegram</p>
          </div>

          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex gap-6 p-6 rounded-2xl transition-all" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-sm" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                  {s.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{s.icon}</span>
                    <h3 className="font-bold text-lg" style={{ color: '#f0f4ff' }}>{s.title}</h3>
                  </div>
                  <p className="text-sm mb-3" style={{ color: '#64748b' }}>{s.desc}</p>
                  {s.code && (
                    <div className="inline-flex items-center space-x-3 px-4 py-2.5 rounded-xl" style={{ backgroundColor: '#0d1117', border: '1px solid rgba(37,99,235,0.3)' }}>
                      <span className="font-mono font-bold text-sm" style={{ color: '#60a5fa' }}>{s.code}</span>
                      <span className="text-xs" style={{ color: '#475569' }}>— send this to the bot</span>
                    </div>
                  )}
                  {s.action && (
                    <a href={s.action.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff' }}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
                      </svg>
                      <span>{s.action.label}</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Command reference */}
          <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: '#16182a', border: '1px solid rgba(37,99,235,0.3)' }}>
            <h3 className="font-bold text-lg mb-4" style={{ color: '#f0f4ff' }}>📋 Quick Command Reference</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { cmd: '/start', desc: 'Initialize the bot' },
                { cmd: '/pair 254XXXXXXXXX', desc: 'Link your WhatsApp number' },
                { cmd: '/status', desc: 'Check your connection status' },
                { cmd: '/help', desc: 'List all available commands' },
              ].map(c => (
                <div key={c.cmd} className="flex items-start space-x-3 p-3 rounded-xl" style={{ backgroundColor: '#0d1117' }}>
                  <code className="font-mono text-sm font-bold" style={{ color: '#60a5fa' }}>{c.cmd}</code>
                  <span className="text-sm" style={{ color: '#64748b' }}>{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold" style={{ color: '#f0f4ff' }}>Bot Features</h2>
            <p className="mt-3" style={{ color: '#64748b' }}>Everything you get with your WhatsApp bot</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="p-6 rounded-2xl transition-all hover:scale-105" style={{ backgroundColor: '#16182a', border: '1px solid #1e2d4a' }}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: '#f0f4ff' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#64748b' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16" style={{ backgroundColor: '#0d0d1a' }}>
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#f0f4ff' }}>Ready to connect?</h2>
          <p className="mb-8" style={{ color: '#64748b' }}>Open the Telegram bot and send <code className="text-blue-400">/pair 254XXXXXXXXX</code> to link your number in seconds.</p>
          <a href="https://t.me/mrsmzazixdbot" target="_blank" rel="noopener noreferrer"
            className="px-8 py-4 rounded-xl font-bold text-white inline-block transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 30px rgba(37,99,235,0.4)' }}>
            t.me/mrsmzazixdbot → Open Now
          </a>
        </div>
      </section>
    </div>
  );
}

