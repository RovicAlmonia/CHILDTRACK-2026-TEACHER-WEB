import { useEffect, useState, useCallback } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, Chip, Skeleton, InputAdornment, Avatar,
  Alert, MenuItem, Tab, Tabs, Table, TableHead,
  TableRow, TableCell, TableBody, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Tooltip,
  CircularProgress,
} from '@mui/material';
import SearchIcon            from '@mui/icons-material/Search';
import NotificationsIcon     from '@mui/icons-material/Notifications';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import CancelIcon            from '@mui/icons-material/Cancel';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import DirectionsCarIcon     from '@mui/icons-material/DirectionsCar';
import EscalatorWarningIcon  from '@mui/icons-material/EscalatorWarning';
import ClearIcon             from '@mui/icons-material/Clear';
import RefreshIcon           from '@mui/icons-material/Refresh';
import AddIcon               from '@mui/icons-material/Add';
import EditIcon              from '@mui/icons-material/Edit';
import DeleteIcon            from '@mui/icons-material/Delete';
import EventIcon             from '@mui/icons-material/Event';
import LocationOnIcon        from '@mui/icons-material/LocationOn';
import SaveIcon              from '@mui/icons-material/Save';
import CalendarMonthIcon     from '@mui/icons-material/CalendarMonth';
import AccessAlarmIcon       from '@mui/icons-material/AccessAlarm';
import CategoryIcon          from '@mui/icons-material/Category';
import { attendanceAPI, eventsAPI } from '../api';
import type { EventPayload } from '../api';
import { useAuth } from '../context/AuthContext';

interface StatusMeta {
  label:  string;
  color:  'success' | 'error' | 'warning' | 'info' | 'default';
  icon:   React.ReactNode;
  bg:     string;
  border: string;
}

const ATTENDANCE_META: Record<string, StatusMeta> = {
  Present:       { label: 'Present',  color: 'success', icon: <CheckCircleIcon />,      bg: '#f0fdf4', border: '#22c55e' },
  Absent:        { label: 'Absent',   color: 'error',   icon: <CancelIcon />,            bg: '#fef2f2', border: '#e63946' },
  Late:          { label: 'Late',     color: 'warning', icon: <AccessTimeIcon />,        bg: '#fffbeb', border: '#f59e0b' },
  'DROP-OFF':    { label: 'Drop-Off', color: 'info',    icon: <DirectionsCarIcon />,     bg: '#eff6ff', border: '#3b82f6' },
  'Drop-Off':    { label: 'Drop-Off', color: 'info',    icon: <DirectionsCarIcon />,     bg: '#eff6ff', border: '#3b82f6' },
  'PICK-UP':     { label: 'Pick-Up',  color: 'info',    icon: <EscalatorWarningIcon />,  bg: '#f5f3ff', border: '#8b5cf6' },
  'Pick-Up':     { label: 'Pick-Up',  color: 'info',    icon: <EscalatorWarningIcon />,  bg: '#f5f3ff', border: '#8b5cf6' },
};

function getStatusMeta(status: string): StatusMeta {
  return ATTENDANCE_META[status] ?? {
    label: status, color: 'default',
    icon: <NotificationsIcon />, bg: '#f9fafb', border: '#9ca3af',
  };
}

function timeAgo(dateStr: string): string {
  const d    = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7)  return `${diff} days ago`;
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ATTENDANCE_FILTERS = [
  { value: '',         label: 'All Types'  },
  { value: 'Present',  label: 'Present'   },
  { value: 'Absent',   label: 'Absent'    },
  { value: 'Late',     label: 'Late'      },
  { value: 'DROP-OFF', label: 'Drop-Off'  },
  { value: 'PICK-UP',  label: 'Pick-Up'   },
];

const EVENT_TYPES = ['Meeting', 'Conference', 'School Event', 'Reminder', 'Holiday', 'Other'];

const EVENT_TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Meeting:      { bg: '#eff6ff', color: '#3b82f6', border: '#93c5fd' },
  Conference:   { bg: '#f5f3ff', color: '#8b5cf6', border: '#c4b5fd' },
  'School Event':{ bg: '#f0fdf4', color: '#22c55e', border: '#86efac' },
  Reminder:     { bg: '#fffbeb', color: '#f59e0b', border: '#fcd34d' },
  Holiday:      { bg: '#fdf2f8', color: '#ec4899', border: '#f9a8d4' },
  Other:        { bg: '#f9fafb', color: '#6b7280', border: '#d1d5db' },
};

function getEventTypeStyle(type: string) {
  return EVENT_TYPE_COLORS[type] ?? EVENT_TYPE_COLORS.Other;
}

function formatScheduled(iso: string): { date: string; time: string; full: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }),
    full: d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
  };
}

function isUpcoming(iso: string): boolean {
  return new Date(iso) >= new Date();
}

const EMPTY_EVENT_FORM = {
  title:        '',
  description:  '',
  event_type:   'Other',
  date:         '',
  time:         '',
  location:     '',
};

export default function NotificationsPage() {
  const { teacher } = useAuth();

  const [tab, setTab] = useState(0);

  const [attendance,    setAttendance]   = useState<any[]>([]);
  const [attLoading,    setAttLoading]   = useState(true);
  const [attError,      setAttError]     = useState('');
  const [attSearch,     setAttSearch]    = useState('');
  const [attType,       setAttType]      = useState('');
  const [attDate,       setAttDate]      = useState(new Date().toISOString().split('T')[0]);

  const [events,        setEvents]       = useState<any[]>([]);
  const [evtLoading,    setEvtLoading]   = useState(true);
  const [evtError,      setEvtError]     = useState('');
  const [evtSuccess,    setEvtSuccess]   = useState('');
  const [evtSearch,     setEvtSearch]    = useState('');
  const [evtTypeFilter, setEvtTypeFilter]= useState('');
  const [evtView,       setEvtView]      = useState<'table' | 'cards'>('table');
  const [dialogOpen,    setDialogOpen]   = useState(false);
  const [editId,        setEditId]       = useState<number | null>(null);
  const [deleteId,      setDeleteId]     = useState<number | null>(null);
  const [saving,        setSaving]       = useState(false);
  const [form,          setForm]         = useState({ ...EMPTY_EVENT_FORM });

  const loadAttendance = useCallback(() => {
    setAttLoading(true);
    attendanceAPI.getAll()
      .then(r => setAttendance(r.data.filter((x: any) => x.status !== 'Dropped Out')))
      .catch(() => setAttError('Failed to load attendance notifications.'))
      .finally(() => setAttLoading(false));
  }, []);

  const loadEvents = useCallback(() => {
    setEvtLoading(true);
    eventsAPI.getAll()
      .then(r => setEvents(r.data))
      .catch(() => setEvtError('Failed to load events.'))
      .finally(() => setEvtLoading(false));
  }, []);

  useEffect(() => {
    loadAttendance();
    loadEvents();
    const id = setInterval(loadAttendance, 30_000);
    return () => clearInterval(id);
  }, [loadAttendance, loadEvents]);

  const today     = new Date().toISOString().split('T')[0];
  const todayRecs = attendance.filter(r => r.date === today);
  const attCounts = {
    total:  todayRecs.length,
    late:   todayRecs.filter(r => r.status === 'Late').length,
    absent: todayRecs.filter(r => r.status === 'Absent').length,
    pickup: todayRecs.filter(r => ['Pick-Up', 'PICK-UP'].includes(r.status)).length,
  };

  const displayedAtt = attendance
    .filter(r => !attDate || r.date === attDate)
    .filter(r => {
      if (!attType) return true;
      if (attType === 'DROP-OFF') return ['DROP-OFF', 'Drop-Off'].includes(r.status);
      if (attType === 'PICK-UP')  return ['PICK-UP',  'Pick-Up' ].includes(r.status);
      return r.status === attType;
    })
    .filter(r => !attSearch || r.student_name?.toLowerCase().includes(attSearch.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const upcomingCount = events.filter(e => isUpcoming(e.scheduled_at)).length;

  const displayedEvt = events
    .filter(e => !evtTypeFilter || e.event_type === evtTypeFilter)
    .filter(e => !evtSearch || [e.title, e.description, e.location, e.teacher_name]
      .some(v => v?.toLowerCase().includes(evtSearch.toLowerCase())))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

  const setF = (k: keyof typeof EMPTY_EVENT_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_EVENT_FORM });
    setEvtError('');
    setDialogOpen(true);
  };

  const openEdit = (evt: any) => {
    setEditId(evt.id);
    const d = new Date(evt.scheduled_at);
    setForm({
      title:       evt.title        ?? '',
      description: evt.description  ?? '',
      event_type:  evt.event_type   ?? 'Other',
      date:        d.toISOString().split('T')[0],
      time:        d.toTimeString().slice(0, 5),
      location:    evt.location     ?? '',
    });
    setEvtError('');
    setDialogOpen(true);
  };

  const saveEvent = async () => {
    if (!form.title.trim()) { setEvtError('Title is required.'); return; }
    if (!form.date)         { setEvtError('Date is required.');  return; }
    if (!form.time)         { setEvtError('Time is required.');  return; }
    setEvtError(''); setSaving(true);

    const payload: EventPayload = {
      title:        form.title.trim(),
      description:  form.description.trim() || undefined,
      event_type:   form.event_type,
      scheduled_at: `${form.date}T${form.time}:00`,
      location:     form.location.trim() || undefined,
      teacher_name: teacher?.name,
    };

    try {
      if (editId !== null) {
        await eventsAPI.update(editId, payload);
        setEvtSuccess('Event updated!');
      } else {
        await eventsAPI.create(payload);
        setEvtSuccess('Event created!');
      }
      setDialogOpen(false);
      loadEvents();
    } catch (e: any) {
      setEvtError(e.response?.data?.error ?? 'Failed to save event.');
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await eventsAPI.remove(deleteId);
      setEvtSuccess('Event deleted.');
      setDeleteId(null);
      loadEvents();
    } catch {
      setEvtError('Failed to delete event.');
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontFamily: '"Nunito", sans-serif', fontWeight: 800,
            fontSize: { xs: '1.6rem', sm: '2rem' },
            color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
          }}>
            Notifications & Events
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Attendance alerts · School events · Auto-refreshes every 30 s
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => { loadAttendance(); loadEvents(); }}
            disabled={attLoading && evtLoading}
            sx={{
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
              color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
              '&:hover': {
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#1a3009',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.08)' : '#f0f7e8',
              },
            }}
          >
            Refresh
          </Button>
          {tab === 1 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ px: 2.5 }}>
              Add Event
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: '2px solid', borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { fontWeight: 700, fontSize: '0.92rem', textTransform: 'none', minHeight: 48 },
            '& .Mui-selected': { color: (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016' },
            '& .MuiTabs-indicator': {
              background: (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
              height: 3, borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon sx={{ fontSize: 18 }} />
                Attendance Alerts
                {attCounts.total > 0 && (
                  <Chip label={attCounts.total} size="small" color="primary"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                )}
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon sx={{ fontSize: 18 }} />
                Events
                {upcomingCount > 0 && (
                  <Chip label={`${upcomingCount} upcoming`} size="small"
                    sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#22c55e' }} />
                )}
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* ══ TAB 0 — ATTENDANCE ALERTS ══ */}
      {tab === 0 && (
        <Box>
          {attError && <Alert severity="error" onClose={() => setAttError('')} sx={{ mb: 2 }}>{attError}</Alert>}

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Total Today',   value: attCounts.total,  color: (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016', icon: <NotificationsIcon /> },
              { label: 'Late Arrivals', value: attCounts.late,   color: '#f59e0b', icon: <AccessTimeIcon /> },
              { label: 'Absences',      value: attCounts.absent, color: '#e63946', icon: <CancelIcon /> },
              { label: 'Pick-ups',      value: attCounts.pickup, color: '#8b5cf6', icon: <EscalatorWarningIcon /> },
            ].map(s => (
              <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                <Card sx={{ borderRadius: '16px' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {attLoading ? <Skeleton height={60} /> : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: typeof s.color === 'string' ? `${s.color}15` : 'rgba(45,80,22,0.1)', width: 44, height: 44, flexShrink: 0 }}>
                          <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            {s.label}
                          </Typography>
                          <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.8rem', color: s.color, lineHeight: 1.1 }}>
                            {s.value}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Filters */}
          <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField type="date" label="Filter by Date" fullWidth size="small"
                    value={attDate} onChange={e => setAttDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField select label="Status Type" fullWidth size="small"
                    value={attType} onChange={e => setAttType(e.target.value)}>
                    {ATTENDANCE_FILTERS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField placeholder="Search student name…" fullWidth size="small"
                    value={attSearch} onChange={e => setAttSearch(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Button variant="outlined" size="small" startIcon={<ClearIcon />}
                    onClick={() => { setAttDate(''); setAttType(''); setAttSearch(''); }}
                    sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Notification cards */}
          {attLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={80} sx={{ borderRadius: '12px' }} />)}
            </Box>
          ) : displayedAtt.length === 0 ? (
            <Card sx={{ borderRadius: '14px', textAlign: 'center', py: 7, border: '1.5px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
              <NotificationsIcon sx={{ fontSize: 56, color: 'action.disabled', mb: 1 }} />
              <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>No notifications found</Typography>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.82rem', mt: 0.5 }}>
                {attDate || attType || attSearch ? 'Try adjusting your filters' : 'Attendance records will appear here'}
              </Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {displayedAtt.map((r, i) => {
                const meta = getStatusMeta(r.status);
                return (
                  <Card key={i} sx={{
                    borderRadius: '12px',
                    borderLeft: `4px solid ${meta.border}`,
                    transition: 'all 0.2s ease',
                    '&:hover': { transform: 'translateX(3px)', boxShadow: '0 6px 24px rgba(0,0,0,0.08)' },
                  }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: meta.bg, width: 46, height: 46, flexShrink: 0, border: `1.5px solid ${meta.border}30` }}>
                          <Box sx={{ color: meta.border, display: 'flex' }}>{meta.icon}</Box>
                        </Avatar>
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.25 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: 'text.primary' }}>
                              {r.student_name}
                            </Typography>
                            <Chip label={meta.label} color={meta.color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                            {r.lrn && <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', fontFamily: 'monospace' }}>LRN: {r.lrn}</Typography>}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 500 }}>📅 {r.date}</Typography>
                            {r.session && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>· Session {r.session}</Typography>}
                            {r.guardian_name && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>· Guardian: {r.guardian_name}</Typography>}
                            {r.by_whom && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>· By: {r.by_whom}</Typography>}
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.disabled', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {timeAgo(r.date)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                  Showing {displayedAtt.length}{attendance.length !== displayedAtt.length ? ` of ${attendance.length}` : ''} notification{displayedAtt.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ══ TAB 1 — EVENTS ══ */}
      {tab === 1 && (
        <Box>
          {evtError   && <Alert severity="error"   onClose={() => setEvtError('')}   sx={{ mb: 2 }}>{evtError}</Alert>}
          {evtSuccess && <Alert severity="success" onClose={() => setEvtSuccess('')} sx={{ mb: 2 }}>{evtSuccess}</Alert>}

          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            {[
              { label: 'Total Events',  value: events.length,                               icon: <EventIcon /> },
              { label: 'Upcoming',      value: upcomingCount,                               color: '#22c55e', icon: <CalendarMonthIcon /> },
              { label: 'Past Events',   value: events.length - upcomingCount,               color: '#9ca3af', icon: <AccessAlarmIcon /> },
              { label: 'Event Types',   value: new Set(events.map(e => e.event_type)).size, color: '#8b5cf6', icon: <CategoryIcon /> },
            ].map(s => (
              <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
                <Card sx={{ borderRadius: '16px' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {evtLoading ? <Skeleton height={60} /> : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                          bgcolor: s.color ? `${s.color}15` : 'rgba(45,80,22,0.1)',
                          width: 44, height: 44, flexShrink: 0,
                        }}>
                          <Box sx={{ color: s.color ?? ((theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016'), display: 'flex' }}>{s.icon}</Box>
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                            {s.label}
                          </Typography>
                          <Typography sx={{
                            fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1.1,
                            color: s.color ?? ((theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016'),
                          }}>
                            {s.value}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Filter + view toggle */}
          <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField select label="Event Type" fullWidth size="small"
                    value={evtTypeFilter} onChange={e => setEvtTypeFilter(e.target.value)}>
                    <MenuItem value="">All Types</MenuItem>
                    {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField placeholder="Search title, location, description…" fullWidth size="small"
                    value={evtSearch} onChange={e => setEvtSearch(e.target.value)}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> } }} />
                </Grid>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Button variant="outlined" size="small" startIcon={<ClearIcon />}
                    onClick={() => { setEvtTypeFilter(''); setEvtSearch(''); }}
                    sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                    Clear
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Box sx={{ display: 'flex', border: '1.5px solid', borderColor: 'divider', borderRadius: '10px', overflow: 'hidden' }}>
                    {(['table', 'cards'] as const).map(v => (
                      <Button key={v} size="small"
                        onClick={() => setEvtView(v)}
                        sx={{
                          borderRadius: 0, px: 2, textTransform: 'capitalize',
                          bgcolor: evtView === v
                            ? (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016'
                            : 'transparent',
                          color: evtView === v ? '#fff' : 'text.secondary',
                          '&:hover': {
                            bgcolor: evtView === v
                              ? (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016'
                              : (theme: any) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.08)' : '#f0f7e8',
                          },
                          fontWeight: 600, fontSize: '0.82rem',
                        }}>
                        {v === 'table' ? 'Table' : 'Cards'}
                      </Button>
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* TABLE VIEW */}
          {evtView === 'table' && (
            <Card sx={{ borderRadius: '14px' }}>
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Box sx={{ overflowX: 'auto' }}>
                  {evtLoading ? (
                    <Box sx={{ p: 3 }}>{[...Array(5)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}</Box>
                  ) : (
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Title', 'Type', 'Date & Time', 'Location', 'Description', 'Status', 'Actions'].map(h => (
                            <TableCell key={h}>{h}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayedEvt.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                              <EventIcon sx={{ fontSize: 52, color: 'action.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                              <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                {evtTypeFilter || evtSearch ? 'No events match your filters' : 'No events yet — click "Add Event" to create one'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : displayedEvt.map(evt => {
                          const fmt   = formatScheduled(evt.scheduled_at);
                          const style = getEventTypeStyle(evt.event_type);
                          const upcoming = isUpcoming(evt.scheduled_at);
                          return (
                            <TableRow key={evt.id}>
                              <TableCell>
                                <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>
                                  {evt.title}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={evt.event_type ?? 'Other'} size="small"
                                  sx={{ bgcolor: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 600, fontSize: '0.72rem' }} />
                              </TableCell>
                              <TableCell>
                                <Typography sx={{
                                  fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap',
                                  color: upcoming
                                    ? (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016'
                                    : 'text.disabled',
                                }}>
                                  {fmt.date}
                                </Typography>
                                <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                                  🕐 {fmt.time}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary', maxWidth: 140 }}>
                                {evt.location ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                    <Typography sx={{ fontSize: '0.83rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {evt.location}
                                    </Typography>
                                  </Box>
                                ) : '—'}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 200 }}>
                                {evt.description ? (
                                  <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {evt.description}
                                  </Typography>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={upcoming ? 'Upcoming' : 'Past'}
                                  size="small"
                                  sx={{
                                    fontWeight: 700, fontSize: '0.7rem',
                                    bgcolor: upcoming ? '#f0fdf4' : '#f9fafb',
                                    color:   upcoming ? '#22c55e'  : '#9ca3af',
                                    border: `1px solid ${upcoming ? '#86efac' : '#e5e7eb'}`,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title="Edit event">
                                    <IconButton size="small" onClick={() => openEdit(evt)}
                                      sx={{ color: '#f59e0b', bgcolor: '#fffbeb', border: '1px solid #fde68a', '&:hover': { bgcolor: '#fef3c7' } }}>
                                      <EditIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete event">
                                    <IconButton size="small" onClick={() => setDeleteId(evt.id)}
                                      sx={{ color: '#e63946', bgcolor: '#fef2f2', border: '1px solid #fecaca', '&:hover': { bgcolor: '#fee2e2' } }}>
                                      <DeleteIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </Box>
                {!evtLoading && displayedEvt.length > 0 && (
                  <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                      {displayedEvt.length} event{displayedEvt.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* CARDS VIEW */}
          {evtView === 'cards' && (
            evtLoading ? (
              <Grid container spacing={2.5}>
                {[...Array(4)].map((_, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                    <Skeleton variant="rounded" height={200} sx={{ borderRadius: '16px' }} />
                  </Grid>
                ))}
              </Grid>
            ) : displayedEvt.length === 0 ? (
              <Card sx={{ borderRadius: '14px', textAlign: 'center', py: 7, border: '1.5px dashed', borderColor: 'divider', bgcolor: 'transparent' }}>
                <EventIcon sx={{ fontSize: 56, color: 'action.disabled', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>No events found</Typography>
              </Card>
            ) : (
              <Grid container spacing={2.5}>
                {displayedEvt.map(evt => {
                  const fmt    = formatScheduled(evt.scheduled_at);
                  const style  = getEventTypeStyle(evt.event_type);
                  const upcoming = isUpcoming(evt.scheduled_at);
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={evt.id}>
                      <Card sx={{
                        borderRadius: '16px',
                        borderTop: `4px solid ${style.color}`,
                        opacity: upcoming ? 1 : 0.75,
                        height: '100%',
                        display: 'flex', flexDirection: 'column',
                      }}>
                        <CardContent sx={{ p: 2.5, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                            <Box sx={{ flex: 1, pr: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary', lineHeight: 1.3, mb: 0.5 }}>
                                {evt.title}
                              </Typography>
                              <Chip label={evt.event_type ?? 'Other'} size="small"
                                sx={{ bgcolor: style.bg, color: style.color, border: `1px solid ${style.border}`, fontWeight: 600, fontSize: '0.7rem' }} />
                            </Box>
                            <Chip
                              label={upcoming ? 'Upcoming' : 'Past'}
                              size="small"
                              sx={{
                                fontWeight: 700, fontSize: '0.68rem', flexShrink: 0,
                                bgcolor: upcoming ? '#f0fdf4' : '#f9fafb',
                                color:   upcoming ? '#22c55e'  : '#9ca3af',
                                border:  `1px solid ${upcoming ? '#86efac' : '#e5e7eb'}`,
                              }}
                            />
                          </Box>

                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1, mb: 1,
                            px: 1.5, py: 1,
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.06)' : '#f8f5f0',
                            borderRadius: '10px',
                          }}>
                            <CalendarMonthIcon sx={{
                              fontSize: 16, flexShrink: 0,
                              color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
                            }} />
                            <Box>
                              <Typography sx={{
                                fontSize: '0.82rem', fontWeight: 700,
                                color: upcoming
                                  ? (theme: any) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016'
                                  : 'text.secondary',
                              }}>
                                {fmt.date}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>🕐 {fmt.time}</Typography>
                            </Box>
                          </Box>

                          {evt.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                              <LocationOnIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0 }} />
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500 }}>
                                {evt.location}
                              </Typography>
                            </Box>
                          )}

                          {evt.description && (
                            <Typography sx={{
                              fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5, mt: 0.5,
                              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                            }}>
                              {evt.description}
                            </Typography>
                          )}
                        </CardContent>

                        <Box sx={{ px: 2.5, pb: 2, pt: 0, display: 'flex', gap: 1 }}>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(evt)}
                            sx={{ flex: 1, color: '#f59e0b', bgcolor: '#fffbeb', border: '1px solid #fde68a',
                              fontSize: '0.78rem', fontWeight: 600, '&:hover': { bgcolor: '#fef3c7' } }}>
                            Edit
                          </Button>
                          <Button size="small" startIcon={<DeleteIcon />} onClick={() => setDeleteId(evt.id)}
                            sx={{ flex: 1, color: '#e63946', bgcolor: '#fef2f2', border: '1px solid #fecaca',
                              fontSize: '0.78rem', fontWeight: 600, '&:hover': { bgcolor: '#fee2e2' } }}>
                            Delete
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )
          )}
        </Box>
      )}

      {/* ADD / EDIT EVENT DIALOG */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          fontFamily: '"Nunito", sans-serif', fontWeight: 700, pb: 1,
          color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
        }}>
          {editId !== null ? 'Edit Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {evtError && <Alert severity="error" onClose={() => setEvtError('')} sx={{ mb: 2 }}>{evtError}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Title *" fullWidth value={form.title} onChange={setF('title')} autoFocus />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField type="date" label="Date *" fullWidth value={form.date} onChange={setF('date')}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField type="time" label="Time *" fullWidth value={form.time} onChange={setF('time')}
                slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Event Type" fullWidth value={form.event_type} onChange={setF('event_type')}>
                {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Location" fullWidth value={form.location} onChange={setF('location')}
                placeholder="e.g. School Auditorium" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Description" fullWidth multiline rows={3} value={form.description}
                onChange={setF('description')} placeholder="Optional details about this event…" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={saveEvent}
            disabled={saving || !form.title.trim() || !form.date || !form.time}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ px: 3 }}>
            {editId !== null ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'text.primary' }}>Delete Event</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary' }}>
            Are you sure you want to permanently delete this event? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}
            sx={{ background: 'linear-gradient(135deg, #e63946, #c62828)' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}