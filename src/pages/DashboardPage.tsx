import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Skeleton, Avatar, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack,
  IconButton, Tooltip,
} from '@mui/material';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import CancelIcon           from '@mui/icons-material/Cancel';
import AccessTimeIcon       from '@mui/icons-material/AccessTime';
import SchoolIcon           from '@mui/icons-material/School';
import DirectionsCarIcon    from '@mui/icons-material/DirectionsCar';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import AddIcon              from '@mui/icons-material/Add';
import CalendarMonthIcon    from '@mui/icons-material/CalendarMonth';
import EditIcon             from '@mui/icons-material/Edit';
import DeleteIcon           from '@mui/icons-material/Delete';
import { attendanceAPI, studentsAPI, schedulesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

// ── helpers ────────────────────────────────────────────────────
const norm      = (s: string) => s?.toLowerCase().replace(/[-_\s]/g, '') ?? '';
const isPresent = (s: string) => norm(s) === 'present';
const isAbsent  = (s: string) => norm(s) === 'absent';
const isLate    = (s: string) => norm(s) === 'late';
const isDropOff = (s: string) => norm(s) === 'dropoff';
const isPickUp  = (s: string) => norm(s) === 'pickup';

// ── Always returns today's date string in YYYY-MM-DD using LOCAL time ─────────
// Using toISOString() would give UTC which can be a day behind in PH (UTC+8).
const getLocalDateStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const fmtTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
};

const DAY_COLOR: Record<string, string> = {
  Monday: '#6366f1', Tuesday: '#0ea5e9', Wednesday: '#10b981',
  Thursday: '#f59e0b', Friday: '#e63946', Saturday: '#8b5cf6',
};

// ── tiny stat card ─────────────────────────────────────────────
function MiniStat({ label, value, icon, color, loading }: {
  label: string; value: number; icon: React.ReactNode; color: string; loading?: boolean;
}) {
  return (
    <Card sx={{ borderRadius: '14px', height: '100%' }}>
      <CardContent sx={{ p: '14px 16px !important' }}>
        {loading ? <Skeleton height={52} /> : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: `${color}22`, width: 40, height: 40, flexShrink: 0 }}>
              <Box sx={{ color, display: 'flex', fontSize: 20 }}>{icon}</Box>
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color, lineHeight: 1,
                fontFamily: '"Barlow Condensed", sans-serif' }}>
                {value}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary',
                textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {label}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ── schedule dialog (add + edit) ───────────────────────────────
const BLANK = { subject: '', day_of_week: 'Monday', start_time: '', end_time: '', room: '' };

function ScheduleDialog({ open, onClose, onSaved, teacherId, teacherName, editing }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  teacherId: number;
  teacherName: string;
  editing: any | null;
}) {
  const [form, setForm]     = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState('');

  useEffect(() => {
    if (editing) {
      setForm({
        subject:     editing.subject     ?? '',
        day_of_week: editing.day_of_week ?? 'Monday',
        start_time:  editing.start_time  ?? '',
        end_time:    editing.end_time    ?? '',
        room:        editing.room        ?? '',
      });
    } else {
      setForm(BLANK);
    }
    setErr('');
  }, [editing, open]);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.subject || !form.start_time || !form.end_time) {
      setErr('Subject, start time and end time are required.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await schedulesAPI.update(editing.id, {
          teacher_id:   teacherId,
          teacher_name: teacherName,
          student_name: 'ALL',
          ...form,
        });
      } else {
        await schedulesAPI.create({
          teacher_id:   teacherId,
          teacher_name: teacherName,
          student_name: 'ALL',
          ...form,
        });
      }
      setForm(BLANK);
      setErr('');
      onSaved();
      onClose();
    } catch {
      setErr('Failed to save. Try again.');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '18px' } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>
        {editing ? 'Edit Class' : 'Add Class Schedule'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Subject" value={form.subject} size="small" fullWidth
            onChange={e => set('subject', e.target.value)}
          />
          <TextField
            select label="Day" value={form.day_of_week} size="small" fullWidth
            onChange={e => set('day_of_week', e.target.value)}
          >
            {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Start time" type="time" value={form.start_time} size="small" fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={e => set('start_time', e.target.value)}
            />
            <TextField
              label="End time" type="time" value={form.end_time} size="small" fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={e => set('end_time', e.target.value)}
            />
          </Box>
          <TextField
            label="Room (optional)" value={form.room} size="small" fullWidth
            onChange={e => set('room', e.target.value)}
          />
          {err && <Typography color="error" fontSize="0.8rem">{err}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          onClick={save} disabled={saving} variant="contained"
          sx={{ borderRadius: '10px', fontWeight: 700 }}
        >
          {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── delete confirm dialog ──────────────────────────────────────
function DeleteDialog({ open, onClose, onConfirm, subject, deleting }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  subject: string;
  deleting: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '18px' } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Delete Class?</DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem' }}>
          Remove <strong>{subject}</strong> from the schedule? This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button
          onClick={onConfirm} disabled={deleting} variant="contained" color="error"
          sx={{ borderRadius: '10px', fontWeight: 700 }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── main dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const { teacher } = useAuth();

  // ── Reactive date — updates at midnight automatically ─────────────────────
  // Stored in state so any change triggers a re-fetch of attendance.
  // Uses local time (not UTC) so Philippine users (UTC+8) get the right date.
  const [todayStr, setTodayStr] = useState<string>(getLocalDateStr);

  // Check every minute whether the calendar day has changed.
  // If so, update todayStr → triggers loadAttendance via its useEffect dep.
  useEffect(() => {
    const id = setInterval(() => {
      const current = getLocalDateStr();
      setTodayStr(prev => prev !== current ? current : prev);
    }, 60_000); // check every 60 s — lightweight, no flicker
    return () => clearInterval(id);
  }, []);

  const [records,      setRecords]      = useState<any[]>([]);
  const [students,     setStudents]     = useState<any[]>([]);
  const [schedules,    setSchedules]    = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [schedLoading, setSchedLoading] = useState(true);

  const [dialogOpen,  setDialogOpen]  = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [deleteOpen,   setDeleteOpen]   = useState(false);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── useCallback so loadAttendance always closes over the latest todayStr ──
  const loadAttendance = useCallback(() => {
    setLoading(true);
    return Promise.all([
      attendanceAPI.getAll(todayStr).then(r => setRecords(r.data)),
      studentsAPI.getAll().then(r => setStudents(r.data)),
    ]).finally(() => setLoading(false));
  }, [todayStr]); // re-created whenever todayStr changes

  const loadSchedules = useCallback(() => {
    setSchedLoading(true);
    schedulesAPI.getByTeacher(teacher!.id)
      .then(r => setSchedules(r.data))
      .finally(() => setSchedLoading(false));
  }, [teacher?.id]);

  // Re-fetch attendance whenever the date changes (midnight rollover or first mount)
  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  useEffect(() => {
    if (teacher?.id) loadSchedules();
  }, [loadSchedules, teacher?.id]);

  const openAdd  = ()       => { setEditingItem(null); setDialogOpen(true); };
  const openEdit = (s: any) => { setEditingItem(s);    setDialogOpen(true); };
  const openDelete = (s: any) => { setDeletingItem(s); setDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await schedulesAPI.delete(deletingItem.id);
      setDeleteOpen(false);
      setDeletingItem(null);
      loadSchedules();
    } catch {
      // keep open so user can retry
    } finally { setDeleting(false); }
  };

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // ── Friendly display for the date pill ────────────────────────────────────
  const displayDate = new Date(todayStr + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const present = records.filter(r => isPresent(r.status)).length;
  const absent  = records.filter(r => isAbsent(r.status)).length;
  const late    = records.filter(r => isLate(r.status)).length;
  const dropoff = records.filter(r => isDropOff(r.status)).length;
  const pickup  = records.filter(r => isPickUp(r.status)).length;
  const total   = students.length;

  const byDay = DAYS.reduce((acc, d) => {
    acc[d] = schedules.filter(s => s.day_of_week === d);
    return acc;
  }, {} as Record<string, any[]>);

  const activeDays = DAYS.filter(d => byDay[d].length > 0);

  return (
    <Box>
      {/* Welcome */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800, fontSize: { xs: '1.6rem', sm: '2rem' },
          color: (t) => t.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
        }}>
          {greet()}, {teacher?.name?.split(' ')[0] ?? 'Teacher'} 👋
        </Typography>

        {/* Live date pill — shows exactly which day's attendance is loaded */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <CalendarMonthIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>
            {displayDate}
          </Typography>
          <Chip
            label="Today"
            size="small"
            sx={{
              height: 20, fontSize: '0.65rem', fontWeight: 800,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(74,222,128,0.12)' : 'rgba(45,80,22,0.08)',
              color:   (t) => t.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
              letterSpacing: 0.6,
            }}
          />
        </Box>
      </Box>

      {/* Mini stat row */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        {[
          { label: 'Students', value: total,   icon: <SchoolIcon fontSize="small" />,            color: '#38c586' },
          { label: 'Present',  value: present, icon: <CheckCircleIcon fontSize="small" />,       color: '#22c55e' },
          { label: 'Absent',   value: absent,  icon: <CancelIcon fontSize="small" />,            color: '#e63946' },
          { label: 'Late',     value: late,    icon: <AccessTimeIcon fontSize="small" />,        color: '#f59e0b' },
          { label: 'Drop-off', value: dropoff, icon: <DirectionsCarIcon fontSize="small" />,    color: '#3b82f6' },
          { label: 'Pick-up',  value: pickup,  icon: <EscalatorWarningIcon fontSize="small" />, color: '#8b5cf6' },
        ].map(s => (
          <Grid key={s.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <MiniStat {...s} loading={loading} />
          </Grid>
        ))}
      </Grid>

      {/* Schedule card */}
      <Card sx={{ borderRadius: '18px' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarMonthIcon sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'text.primary' }}>
                Class Schedule
              </Typography>
              <Chip
                label={`${schedules.length} class${schedules.length !== 1 ? 'es' : ''}`}
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 700, ml: 0.5 }}
              />
            </Box>
            <Button
              startIcon={<AddIcon />} variant="contained" size="small"
              onClick={openAdd}
              sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem',
                textTransform: 'none', px: 2 }}
            >
              Add Class
            </Button>
          </Box>

          {schedLoading ? (
            <Grid container spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : activeDays.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CalendarMonthIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No schedules yet
              </Typography>
              <Typography sx={{ color: 'text.disabled', fontSize: '0.83rem', mt: 0.5 }}>
                Click "Add Class" to create your first schedule
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {activeDays.map(day => (
                <Grid key={day} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{
                    borderRadius: '14px', overflow: 'hidden',
                    border: '1px solid', borderColor: 'divider',
                  }}>
                    {/* Day header */}
                    <Box sx={{
                      bgcolor: DAY_COLOR[day], px: 2, py: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.88rem' }}>
                        {day}
                      </Typography>
                      <Chip
                        label={`${byDay[day].length} class${byDay[day].length > 1 ? 'es' : ''}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff',
                          fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                      />
                    </Box>

                    {/* Class rows */}
                    <Box>
                      {byDay[day].map((s, i) => (
                        <Box key={s.id}>
                          <Box sx={{
                            px: 2, py: 1, display: 'flex',
                            alignItems: 'center', justifyContent: 'space-between', gap: 1,
                          }}>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem',
                                color: 'text.primary', lineHeight: 1.2 }}>
                                {s.subject}
                              </Typography>
                              {s.room && (
                                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled',
                                  fontWeight: 600, mt: 0.3 }}>
                                  📍 {s.room}
                                </Typography>
                              )}
                              <Chip
                                label={`${fmtTime(s.start_time)} – ${fmtTime(s.end_time)}`}
                                size="small"
                                sx={{ mt: 0.5, fontSize: '0.68rem', fontWeight: 700,
                                  bgcolor: `${DAY_COLOR[day]}18`,
                                  color: DAY_COLOR[day], border: 'none' }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', flexShrink: 0 }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => openEdit(s)}
                                  sx={{ color: 'text.secondary',
                                    '&:hover': { color: DAY_COLOR[day] } }}
                                >
                                  <EditIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => openDelete(s)}
                                  sx={{ color: 'text.secondary',
                                    '&:hover': { color: '#e63946' } }}
                                >
                                  <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                          {i < byDay[day].length - 1 && <Divider sx={{ borderColor: 'divider' }} />}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit dialog */}
      <ScheduleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaved={loadSchedules}
        teacherId={teacher!.id}
        teacherName={teacher?.name ?? ''}
        editing={editingItem}
      />

      {/* Delete confirm dialog */}
      <DeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        subject={deletingItem?.subject ?? ''}
        deleting={deleting}
      />
    </Box>
  );
}