import { useEffect, useState, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody,
  Skeleton, InputAdornment, Avatar, Alert, CircularProgress,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
} from '@mui/material';
import SearchIcon        from '@mui/icons-material/Search';
import PersonOffIcon     from '@mui/icons-material/PersonOff';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MaleIcon          from '@mui/icons-material/Male';
import FemaleIcon        from '@mui/icons-material/Female';
import ClearIcon         from '@mui/icons-material/Clear';
import FilterAltIcon     from '@mui/icons-material/FilterAlt';
import EditIcon          from '@mui/icons-material/Edit';
import SaveIcon          from '@mui/icons-material/Save';
import CloseIcon         from '@mui/icons-material/Close';
import { attendanceAPI, scanPhotosAPI } from '../api';

/* ─────────── Backend base URL ─────────────────────────────────────────── */
const BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL
    ? ((import.meta as any).env.VITE_API_URL as string).replace('/api', '')
    : 'http://localhost:5000';

/* ─────────── Photo fetcher (blob-URL fix) ─────────── */
async function fetchLatestPhoto(
  studentName: string,
  cache: React.MutableRefObject<Record<string, string | null>>
): Promise<string | null> {
  if (Object.prototype.hasOwnProperty.call(cache.current, studentName)) {
    return cache.current[studentName];
  }
  try {
    const { data } = await scanPhotosAPI.getAll(studentName);
    const photos: Array<{ photo_path: string; status: string }> = data;
    const scan =
      photos.find(p => p.status !== 'guardian_registration') ??
      photos[0] ??
      null;

    if (!scan?.photo_path) { cache.current[studentName] = null; return null; }

    const photoPath = scan.photo_path.startsWith('http')
      ? scan.photo_path
      : `${BACKEND_URL}${scan.photo_path}`;

    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(photoPath, { headers });
    if (!res.ok) { cache.current[studentName] = null; return null; }
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    cache.current[studentName] = blobUrl;
    return blobUrl;
  } catch {
    cache.current[studentName] = null;
    return null;
  }
}

/* ─────────── StudentAvatar ─────────── */
interface StudentAvatarProps {
  studentName: string;
  photoCache: React.MutableRefObject<Record<string, string | null>>;
  onPhotoClick: (name: string, url: string) => void;
}

function StudentAvatar({ studentName, photoCache, onPhotoClick }: StudentAvatarProps) {
  const [photoPath, setPhotoPath] = useState<string | null>(() =>
    Object.prototype.hasOwnProperty.call(photoCache.current, studentName)
      ? photoCache.current[studentName]
      : null
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    if (Object.prototype.hasOwnProperty.call(photoCache.current, studentName)) {
      setPhotoPath(photoCache.current[studentName]);
      return;
    }
    let cancelled = false;
    fetchLatestPhoto(studentName, photoCache).then(p => {
      if (!cancelled) setPhotoPath(p);
    });
    return () => { cancelled = true; };
  }, [studentName, photoCache]);

  const initial = studentName?.charAt(0)?.toUpperCase() ?? '?';

  const baseSx = {
    width: 32, height: 32,
    fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
  };

  if (photoPath && !imgError) {
    return (
      <Avatar
        src={photoPath}
        alt={studentName}
        sx={{
          ...baseSx,
          bgcolor: 'transparent',
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          '&:hover': { transform: 'scale(1.12)', boxShadow: '0 0 0 2px #e63946' },
          '& img': { objectFit: 'cover', width: '100%', height: '100%' },
        }}
        onClick={() => onPhotoClick(studentName, photoPath)}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <Avatar sx={{ ...baseSx, bgcolor: 'action.selected', color: 'text.secondary' }}>
      {initial}
    </Avatar>
  );
}

/* ─────────── Page helpers ─────────── */
const STATUSES = ['Present', 'Absent', 'Late', 'DROP-OFF', 'PICK-UP', 'Dropped Out'];

const normalizeStatus = (s: string) => (s ?? '').toLowerCase().replace(/[-_\s]/g, '');
const isDroppedOut = (s: string) => {
  const n = normalizeStatus(s);
  return n === 'droppedout' || n.includes('dropout') || n.includes('droppedout');
};

const canonicalStatus = (s: string): string => {
  const n = normalizeStatus(s);
  if (n === 'present')    return 'Present';
  if (n === 'absent')     return 'Absent';
  if (n === 'late')       return 'Late';
  if (n === 'dropoff')    return 'DROP-OFF';
  if (n === 'pickup')     return 'PICK-UP';
  if (n === 'droppedout') return 'Dropped Out';
  return s;
};

const EMPTY_FORM = {
  student_name: '', lrn: '', gender: '', status: 'Dropped Out',
  session: 'AM', date: new Date().toISOString().split('T')[0],
  guardian_name: '', by_whom: '',
};

/* ════════════════════════════════════════════════════════════════════════
   DropoutsPage
════════════════════════════════════════════════════════════════════════ */
export default function DropoutsPage() {
  const photoCache = useRef<Record<string, string | null>>({});

  const [all,        setAll]        = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [search,     setSearch]     = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [editId,     setEditId]     = useState<number | null>(null);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [photoDialog, setPhotoDialog] = useState<{ name: string; url: string } | null>(null);

  const setF = (k: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const load = (date?: string) => {
    setLoading(true);
    attendanceAPI.getAll(date || undefined)
      .then(r => {
        const dropouts = r.data.filter((x: any) => isDroppedOut(x.status));
        setAll(dropouts);
      })
      .catch(() => setError('Failed to load dropout records.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      student_name:  r.student_name  ?? '',
      lrn:           r.lrn           ?? '',
      gender:        r.gender        ?? '',
      status:        canonicalStatus(r.status ?? 'Dropped Out'),
      session:       r.session       ?? 'AM',
      date:          r.date          ?? '',
      guardian_name: r.guardian_name ?? '',
      by_whom:       r.by_whom       ?? '',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.student_name.trim()) { setError('Student name is required.'); return; }
    setError(''); setSaving(true);
    try {
      await attendanceAPI.update(editId!, form);
      setSuccess('Record updated successfully!');
      setDialogOpen(false);
      load(undefined);
      setFilterDate('');
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const now = new Date();
  const thisMonth = all.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const males   = all.filter(r => r.gender?.toLowerCase() === 'male').length;
  const females = all.filter(r => r.gender?.toLowerCase() === 'female').length;

  const displayed = all
    .filter(r => !search || r.student_name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDateChange = (date: string) => {
    setFilterDate(date);
    load(date || undefined);
  };

  const handleClear = () => {
    setFilterDate('');
    setSearch('');
    load(undefined);
  };

  const statCards = [
    { label: 'Total Dropouts', value: all.length, color: '#e63946', icon: <PersonOffIcon /> },
    { label: 'This Month',     value: thisMonth,  color: '#f59e0b', icon: <CalendarMonthIcon /> },
    { label: 'Male',           value: males,      color: '#3b82f6', icon: <MaleIcon /> },
    { label: 'Female',         value: females,    color: '#ec4899', icon: <FemaleIcon /> },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800, fontSize: { xs: '1.7rem', sm: '2.1rem' },
          color: '#e63946', letterSpacing: 0.3,
        }}>
          Dropouts
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Students who have been marked as dropped out
        </Typography>
      </Box>

      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map(s => (
          <Grid size={{ xs: 6, sm: 3 }} key={s.label}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 2.5 }}>
                {loading ? <Skeleton height={60} /> : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{
                      bgcolor: `${s.color}18`, width: 44, height: 44, flexShrink: 0,
                      border: `1.5px solid ${s.color}30`,
                    }}>
                      <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                    </Avatar>
                    <Box>
                      <Typography sx={{
                        fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary',
                        textTransform: 'uppercase', letterSpacing: 0.6,
                      }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{
                        fontFamily: '"Barlow Condensed", sans-serif',
                        fontWeight: 800, fontSize: '1.9rem', color: s.color, lineHeight: 1.1,
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

      {/* Filter bar */}
      <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterAltIcon fontSize="small" sx={{ color: '#e63946' }} />
                <Typography sx={{ fontWeight: 700, color: '#e63946', fontSize: '0.9rem' }}>Filters</Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                type="date" label="Filter by Date" fullWidth size="small"
                value={filterDate}
                onChange={e => handleDateChange(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                placeholder="Search student name…" fullWidth size="small"
                value={search} onChange={e => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={handleClear}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: '14px' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ overflowX: 'auto' }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    {['Student Name', 'LRN', 'Gender', 'Date Dropped', 'Session', 'Actions'].map(h => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                        <PersonOffIcon sx={{ fontSize: 52, color: 'action.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {filterDate || search ? 'No results match your filters' : 'No dropout records found'}
                        </Typography>
                        <Typography sx={{ color: 'text.disabled', fontSize: '0.82rem', mt: 0.5 }}>
                          {filterDate
                            ? `No dropouts recorded for ${filterDate}`
                            : 'Students marked "Dropped Out" in attendance will appear here'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : displayed.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <StudentAvatar
                            studentName={r.student_name}
                            photoCache={photoCache}
                            onPhotoClick={(name, url) => setPhotoDialog({ name, url })}
                          />
                          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'text.primary' }}>
                            {r.student_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                        {r.lrn || '—'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{r.gender || '—'}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#e63946' }}>
                        {r.date}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.primary' }}>{r.session}</TableCell>
                      <TableCell>
                        <Tooltip title="Edit record">
                          <IconButton
                            size="small" onClick={() => openEdit(r)}
                            sx={{
                              color: '#f59e0b !important',
                              bgcolor: 'rgba(245,158,11,0.1)',
                              border: '1px solid rgba(245,158,11,0.3)',
                              '&:hover': { bgcolor: 'rgba(245,158,11,0.2)' },
                            }}
                          >
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
          {!loading && displayed.length > 0 && (
            <Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {displayed.length} dropout record{displayed.length !== 1 ? 's' : ''}
                {filterDate ? ` for ${filterDate}` : ''}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Barlow Condensed", sans-serif', fontWeight: 800, pb: 1, color: '#e63946', letterSpacing: 0.3 }}>
          Edit Dropout Record
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Student Name *" fullWidth value={form.student_name} onChange={setF('student_name')} autoFocus />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="LRN" fullWidth value={form.lrn} onChange={setF('lrn')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Gender" fullWidth value={form.gender} onChange={setF('gender')}>
                <MenuItem value="">— Not specified —</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField type="date" label="Date" fullWidth value={form.date} onChange={setF('date')} slotProps={{ inputLabel: { shrink: true } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Session" fullWidth value={form.session} onChange={setF('session')}>
                <MenuItem value="AM">AM</MenuItem>
                <MenuItem value="PM">PM</MenuItem>
                <MenuItem value="FULL">Full Day</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField select label="Status *" fullWidth value={form.status} onChange={setF('status')}>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Guardian Name" fullWidth value={form.guardian_name} onChange={setF('guardian_name')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="By Whom" fullWidth value={form.by_whom} onChange={setF('by_whom')} helperText="Who dropped off / picked up" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button
            variant="contained" onClick={save}
            disabled={saving || !form.student_name.trim()}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{ px: 3, bgcolor: '#e63946', '&:hover': { bgcolor: '#c62828' } }}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo expand dialog */}
      <Dialog
        open={photoDialog !== null}
        onClose={() => setPhotoDialog(null)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <DialogTitle sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          pb: 1, fontWeight: 700, fontSize: '1rem',
        }}>
          {photoDialog?.name}
          <IconButton size="small" onClick={() => setPhotoDialog(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {photoDialog && (
            <Box
              component="img"
              src={photoDialog.url}
              alt={photoDialog.name}
              sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: '#f8fafc' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}