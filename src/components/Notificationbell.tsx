// components/NotificationBell.tsx
// Drop this into your Layout — import and place inside .lt-topbar-right
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { attendanceAPI, eventsAPI } from '../api';

interface NotifItem {
  id: string;
  type: 'attendance' | 'event';
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  color: string;
  isRead: boolean;
  raw: any;
}

const STATUS_META: Record<string, { icon: string; color: string; label: string }> = {
  Present:    { icon: '✅', color: '#22c55e', label: 'is present'      },
  Absent:     { icon: '❌', color: '#e63946', label: 'is absent'       },
  Late:       { icon: '⏰', color: '#f59e0b', label: 'arrived late'    },
  'DROP-OFF': { icon: '🚗', color: '#3b82f6', label: 'was dropped off' },
  'Drop-Off': { icon: '🚗', color: '#3b82f6', label: 'was dropped off' },
  'PICK-UP':  { icon: '🧒', color: '#8b5cf6', label: 'was picked up'   },
  'Pick-Up':  { icon: '🧒', color: '#8b5cf6', label: 'was picked up'   },
};

const EVENT_COLORS: Record<string, string> = {
  Meeting:       '#3b82f6',
  Conference:    '#8b5cf6',
  'School Event':'#22c55e',
  Reminder:      '#f59e0b',
  Holiday:       '#ec4899',
  Other:         '#6b7280',
};

function timeAgo(dateStr: string): string {
  const d    = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days === 1)  return 'Yesterday';
  if (days < 7)   return `${days}d ago`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

const STORAGE_KEY = 'ct-read-notifs';

function getReadSet(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveReadSet(s: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...s]));
}

export default function NotificationBell({ dark }: { dark: boolean }) {
  const navigate  = useNavigate();
  const [open, setOpen]         = useState(false);
  const [items, setItems]       = useState<NotifItem[]>([]);
  const [loading, setLoading]   = useState(false);
  const [readIds, setReadIds]   = useState<Set<string>>(getReadSet);
  const dropRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [attRes, evtRes] = await Promise.allSettled([
        attendanceAPI.getAll(),
        eventsAPI.getAll(),
      ]);

      const list: NotifItem[] = [];

      // ── Attendance (today only, no Dropped Out) ──────────────
      if (attRes.status === 'fulfilled') {
        const todayRecs = (attRes.value.data || []).filter(
          (r: any) => r.date === today && r.status !== 'Dropped Out',
        );
        for (const r of todayRecs) {
          const meta = STATUS_META[r.status] ?? { icon: '🔔', color: '#6b7280', label: r.status };
          list.push({
            id:       `att-${r.id ?? r.student_id + r.date + r.status}`,
            type:     'attendance',
            icon:     meta.icon,
            color:    meta.color,
            title:    r.student_name ?? 'Student',
            subtitle: meta.label + (r.session ? ` (Session ${r.session})` : ''),
            time:     timeAgo(r.created_at ?? r.date),
            isRead:   false,
            raw:      r,
          });
        }
      }

      // ── Upcoming events (next 7 days) ─────────────────────────
      if (evtRes.status === 'fulfilled') {
        const now  = new Date();
        const week = new Date(now.getTime() + 7 * 86_400_000);
        const upcoming = (evtRes.value.data || []).filter((e: any) => {
          const d = new Date(e.scheduled_at);
          return d >= now && d <= week;
        });
        for (const e of upcoming) {
          const color = EVENT_COLORS[e.event_type] ?? '#6b7280';
          list.push({
            id:       `evt-${e.id}`,
            type:     'event',
            icon:     '📅',
            color,
            title:    e.title,
            subtitle: e.event_type + (e.location ? ` · ${e.location}` : ''),
            time:     timeAgo(e.scheduled_at),
            isRead:   false,
            raw:      e,
          });
        }
      }

      // newest first
      list.sort((a, b) => {
        const da = a.type === 'attendance' ? (a.raw.created_at ?? a.raw.date) : a.raw.scheduled_at;
        const db = b.type === 'attendance' ? (b.raw.created_at ?? b.raw.date) : b.raw.scheduled_at;
        return new Date(db).getTime() - new Date(da).getTime();
      });

      const read = getReadSet();
      setItems(list.map(i => ({ ...i, isRead: read.has(i.id) })));
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + 30-s poll
  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = items.filter(i => !i.isRead).length;

  const markAllRead = () => {
    const all = new Set(items.map(i => i.id));
    saveReadSet(all);
    setReadIds(all);
    setItems(p => p.map(i => ({ ...i, isRead: true })));
  };

  const markOneRead = (id: string) => {
    const next = new Set(readIds);
    next.add(id);
    saveReadSet(next);
    setReadIds(next);
    setItems(p => p.map(i => i.id === id ? { ...i, isRead: true } : i));
  };

  const handleItemClick = (item: NotifItem) => {
    markOneRead(item.id);
    setOpen(false);
    navigate('/notifications');
  };

  // ── styles ──────────────────────────────────────────────────
  const c = {
    wrap:  { position: 'relative' as const },
    btn: {
      position:    'relative' as const,
      width:        34, height: 34,
      borderRadius: '50%',
      border:       `1.5px solid ${dark ? 'rgba(56,197,134,0.25)' : '#e5e7eb'}`,
      background:   dark ? 'rgba(56,197,134,0.06)' : '#f9fafb',
      cursor:       'pointer',
      display:      'flex', alignItems: 'center', justifyContent: 'center',
      fontSize:     '1rem',
      transition:   'all 0.15s',
      flexShrink:   0,
    },
    badge: {
      position:   'absolute' as const, top: -3, right: -3,
      minWidth:   17, height: 17, borderRadius: 9,
      background: '#e63946', color: '#fff',
      fontSize:   '0.58rem', fontWeight: 800,
      display:    'flex', alignItems: 'center', justifyContent: 'center',
      padding:    '0 3px',
      border:     `2px solid ${dark ? '#1e293b' : '#ffffff'}`,
      lineHeight: 1,
    },
    drop: {
      position:    'absolute' as const,
      top:         42, right: 0,
      width:       340,
      maxHeight:   480,
      borderRadius: 14,
      overflow:    'hidden',
      background:  dark ? '#1e293b' : '#ffffff',
      border:      `1.5px solid ${dark ? 'rgba(56,197,134,0.2)' : '#e5e7eb'}`,
      boxShadow:   dark
        ? '0 20px 60px rgba(0,0,0,0.5)'
        : '0 20px 60px rgba(0,0,0,0.15)',
      zIndex:      9999,
      display:     'flex', flexDirection: 'column' as const,
    },
    header: {
      display:      'flex', alignItems: 'center', justifyContent: 'space-between',
      padding:      '14px 16px 10px',
      borderBottom: `1px solid ${dark ? 'rgba(56,197,134,0.12)' : '#f0f0f0'}`,
      flexShrink:   0,
    },
    headerTitle: {
      fontFamily:  "'Nunito', sans-serif",
      fontWeight:  800, fontSize: '1rem',
      color:       dark ? '#e2e8f0' : '#111827',
    },
    markAllBtn: {
      fontFamily:  "'Nunito', sans-serif",
      fontWeight:  700, fontSize: '0.72rem',
      color:       dark ? '#38c586' : '#2d5016',
      background:  'none', border: 'none', cursor: 'pointer',
      padding:     '2px 6px', borderRadius: 5,
    },
    scroll: {
      overflowY:   'auto' as const,
      flex:        1,
      scrollbarWidth: 'thin' as const,
    },
    item: (isRead: boolean) => ({
      display:    'flex', alignItems: 'flex-start', gap: 11,
      padding:    '10px 14px',
      cursor:     'pointer',
      background: isRead
        ? 'transparent'
        : (dark ? 'rgba(56,197,134,0.07)' : '#f0f9ff'),
      borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.04)' : '#f5f5f5'}`,
      transition: 'background 0.12s',
    }),
    iconWrap: (color: string) => ({
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
      background: `${color}18`,
      border:     `1.5px solid ${color}40`,
      display:    'flex', alignItems: 'center', justifyContent: 'center',
      fontSize:   '1rem',
    }),
    itemTitle: {
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700, fontSize: '0.83rem',
      color:      dark ? '#e2e8f0' : '#111827',
      lineHeight: 1.3,
    },
    itemSub: {
      fontFamily: "'Nunito', sans-serif",
      fontSize:   '0.72rem',
      color:      dark ? '#94a3b8' : '#6b7280',
      marginTop:  2, lineHeight: 1.3,
    },
    itemTime: {
      fontFamily: "'Nunito', sans-serif",
      fontSize:   '0.65rem',
      color:      dark ? '#38c586' : '#2d5016',
      fontWeight: 600, marginTop: 3,
    },
    dot: {
      width: 8, height: 8, borderRadius: '50%',
      background: '#3b82f6', flexShrink: 0, marginTop: 5,
    },
    empty: {
      padding: '40px 20px', textAlign: 'center' as const,
      fontFamily: "'Nunito', sans-serif",
      color: dark ? '#475569' : '#9ca3af',
      fontSize: '0.82rem',
    },
    footer: {
      borderTop:  `1px solid ${dark ? 'rgba(56,197,134,0.12)' : '#f0f0f0'}`,
      padding:    '10px 14px',
      flexShrink: 0,
    },
    seeAll: {
      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.8rem',
      color:      dark ? '#38c586' : '#2d5016',
      padding:    '4px 0',
    },
  };

  return (
    <div style={c.wrap} ref={dropRef}>
      {/* ── Bell button ── */}
      <button
        style={c.btn}
        onClick={() => { setOpen(p => !p); if (!open) load(); }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={c.badge}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={c.drop}>
          {/* Header */}
          <div style={c.header}>
            <span style={c.headerTitle}>
              Notifications {unread > 0 && `(${unread})`}
            </span>
            {unread > 0 && (
              <button style={c.markAllBtn} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={c.scroll}>
            {loading && items.length === 0 ? (
              <div style={c.empty}>Loading…</div>
            ) : items.length === 0 ? (
              <div style={c.empty}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              items.slice(0, 30).map(item => (
                <div
                  key={item.id}
                  style={c.item(item.isRead)}
                  onClick={() => handleItemClick(item)}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      dark ? 'rgba(56,197,134,0.1)' : '#f0f7e8';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background =
                      item.isRead ? 'transparent' : (dark ? 'rgba(56,197,134,0.07)' : '#f0f9ff');
                  }}
                >
                  <div style={c.iconWrap(item.color)}>{item.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={c.itemTitle}>{item.title}</div>
                    <div style={c.itemSub}>{item.subtitle}</div>
                    <div style={c.itemTime}>{item.time}</div>
                  </div>
                  {!item.isRead && <div style={c.dot} />}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div style={c.footer}>
              <button
                style={c.seeAll}
                onClick={() => { setOpen(false); navigate('/notifications'); }}
              >
                See all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}