import { useEffect, useState, useRef } from 'react';
import { Box, Grid, Card, CardContent, Typography, TextField, Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Skeleton, InputAdornment, Avatar, Alert, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Tabs, Tab, } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { attendanceAPI, scanPhotosAPI, absenceReasonsAPI } from '../api';
/* ─────────── Backend base URL ─────────────────────────────────────────── */
const BACKEND_URL = import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';
/* ─────────── Photo fetcher (blob-URL fix) ─────────── */
async function fetchLatestPhoto(studentName, cache) {
    if (Object.prototype.hasOwnProperty.call(cache.current, studentName)) {
        return cache.current[studentName];
    }
    try {
        const { data } = await scanPhotosAPI.getAll(studentName);
        const photos = data;
        const scan = photos.find(p => p.status !== 'guardian_registration') ??
            photos[0] ??
            null;
        if (!scan?.photo_path) {
            cache.current[studentName] = null;
            return null;
        }
        const photoPath = scan.photo_path.startsWith('http')
            ? scan.photo_path
            : `${BACKEND_URL}${scan.photo_path}`;
        const token = localStorage.getItem('ct_token') || '';
        const headers = {};
        if (token)
            headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(photoPath, { headers });
        if (!res.ok) {
            cache.current[studentName] = null;
            return null;
        }
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        cache.current[studentName] = blobUrl;
        return blobUrl;
    }
    catch {
        cache.current[studentName] = null;
        return null;
    }
}
function StudentAvatar({ studentName, photoCache, onPhotoClick }) {
    const [photoPath, setPhotoPath] = useState(() => Object.prototype.hasOwnProperty.call(photoCache.current, studentName)
        ? photoCache.current[studentName]
        : null);
    const [imgError, setImgError] = useState(false);
    useEffect(() => {
        setImgError(false);
        if (Object.prototype.hasOwnProperty.call(photoCache.current, studentName)) {
            setPhotoPath(photoCache.current[studentName]);
            return;
        }
        let cancelled = false;
        fetchLatestPhoto(studentName, photoCache).then(p => {
            if (!cancelled)
                setPhotoPath(p);
        });
        return () => { cancelled = true; };
    }, [studentName, photoCache]);
    const initial = studentName?.charAt(0)?.toUpperCase() ?? '?';
    const baseSx = { width: 32, height: 32, fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 };
    if (photoPath && !imgError) {
        return (<Avatar src={photoPath} alt={studentName} sx={{
                ...baseSx,
                bgcolor: 'transparent',
                cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': { transform: 'scale(1.12)', boxShadow: '0 0 0 2px #e63946' },
                '& img': { objectFit: 'cover', width: '100%', height: '100%' },
            }} onClick={() => onPhotoClick(studentName, photoPath)} onError={() => setImgError(true)}/>);
    }
    return (<Avatar sx={{ ...baseSx, bgcolor: 'rgba(230,57,70,0.12)', color: '#e63946' }}>
      {initial}
    </Avatar>);
}
/* ─────────── Helpers ─────────── */
const STATUSES = ['Present', 'Absent', 'Late', 'DROP-OFF', 'PICK-UP', 'Dropped Out'];
const normalizeStatus = (s) => s?.toLowerCase().replace(/[-_\s]/g, '');
const isAbsent = (s) => normalizeStatus(s) === 'absent';
const canonicalStatus = (s) => {
    const n = normalizeStatus(s);
    if (n === 'present')
        return 'Present';
    if (n === 'absent')
        return 'Absent';
    if (n === 'late')
        return 'Late';
    if (n === 'dropoff')
        return 'DROP-OFF';
    if (n === 'pickup')
        return 'PICK-UP';
    if (n === 'droppedout')
        return 'Dropped Out';
    return s;
};
const EMPTY_FORM = {
    student_name: '', lrn: '', gender: '', status: 'Absent',
    session: 'AM', date: new Date().toISOString().split('T')[0],
    guardian_name: '', by_whom: '',
};
const reasonStatusColor = (s) => {
    if (s === 'approved')
        return { color: '#16a34a', bg: 'rgba(22,163,74,0.10)', border: 'rgba(22,163,74,0.25)' };
    if (s === 'rejected')
        return { color: '#e63946', bg: 'rgba(230,57,70,0.10)', border: 'rgba(230,57,70,0.25)' };
    return { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
};
/* ════════════════════════════════════════════════════════════════════════
   AbsencesPage
════════════════════════════════════════════════════════════════════════ */
export default function AbsencesPage() {
    const photoCache = useRef({});
    const [activeTab, setActiveTab] = useState(0);
    /* ── Absences tab state ── */
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [photoDialog, setPhotoDialog] = useState(null);
    /* ── Reasons tab state ── */
    const [reasons, setReasons] = useState([]);
    const [reasonsLoading, setReasonsLoading] = useState(false);
    const [reasonsError, setReasonsError] = useState('');
    const [reasonsSuccess, setReasonsSuccess] = useState('');
    const [reasonSearch, setReasonSearch] = useState('');
    const [reasonDate, setReasonDate] = useState('');
    const [reasonStatus, setReasonStatus] = useState('');
    const [updatingId, setUpdatingId] = useState(null);
    const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    /* ── Loaders ── */
    const load = (date) => {
        setLoading(true);
        attendanceAPI.getAll(date || undefined)
            .then(r => setAll(r.data.filter((x) => isAbsent(x.status))))
            .catch(() => setError('Failed to load absences.'))
            .finally(() => setLoading(false));
    };
    const loadReasons = (params) => {
        setReasonsLoading(true);
        absenceReasonsAPI.getAll(params)
            .then(r => setReasons(r.data))
            .catch(() => setReasonsError('Failed to load absence reasons.'))
            .finally(() => setReasonsLoading(false));
    };
    useEffect(() => { load(new Date().toISOString().split('T')[0]); }, []);
    useEffect(() => { if (activeTab === 1)
        loadReasons(); }, [activeTab]);
    /* ── Absences tab handlers ── */
    const openEdit = (r) => {
        setEditId(r.id);
        setForm({
            student_name: r.student_name ?? '',
            lrn: r.lrn ?? '',
            gender: r.gender ?? '',
            status: canonicalStatus(r.status ?? 'Absent'),
            session: r.session ?? 'AM',
            date: r.date ?? '',
            guardian_name: r.guardian_name ?? '',
            by_whom: r.by_whom ?? '',
        });
        setDialogOpen(true);
    };
    const save = async () => {
        if (!form.student_name.trim()) {
            setError('Student name is required.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await attendanceAPI.update(editId, form);
            setSuccess('Record updated successfully!');
            setDialogOpen(false);
            load(filterDate || undefined);
        }
        catch (e) {
            setError(e.response?.data?.error ?? 'Failed to save.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDateChange = (date) => { setFilterDate(date); load(date || undefined); };
    const handleClear = () => { setFilterDate(''); setSearch(''); load(undefined); };
    /* ── Reasons tab handlers ── */
    const updateReasonStatus = async (id, status) => {
        setUpdatingId(id);
        setReasonsError('');
        try {
            await absenceReasonsAPI.update(id, { status });
            setReasonsSuccess(`Reason ${status} successfully.`);
            loadReasons({ date: reasonDate || undefined, status: reasonStatus || undefined });
        }
        catch {
            setReasonsError('Failed to update status.');
        }
        finally {
            setUpdatingId(null);
        }
    };
    const handleReasonFilter = () => {
        loadReasons({ date: reasonDate || undefined, status: reasonStatus || undefined });
    };
    const handleReasonClear = () => {
        setReasonSearch('');
        setReasonDate('');
        setReasonStatus('');
        loadReasons();
    };
    const filteredReasons = reasons.filter(r => !reasonSearch ||
        r.student_name?.toLowerCase().includes(reasonSearch.toLowerCase()) ||
        r.submitted_by?.toLowerCase().includes(reasonSearch.toLowerCase()));
    /* ── Stats ── */
    const today = new Date().toISOString().split('T')[0];
    const todayAbsent = all.filter(r => r.date === today).length;
    const uniqueStudents = new Set(all.map(r => r.student_name)).size;
    const pendingReasons = reasons.filter(r => r.status === 'pending').length;
    const displayed = all
        .filter(r => !search || r.student_name?.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const statCards = [
        { label: 'Total Absence Records', value: all.length, color: '#e63946', icon: <EventBusyIcon /> },
        { label: 'Absent Today', value: todayAbsent, color: '#f59e0b', icon: <CalendarTodayIcon /> },
        { label: 'Unique Students', value: uniqueStudents, color: 'primary.main', icon: <PersonIcon /> },
        { label: 'Pending Reasons', value: pendingReasons, color: '#8b5cf6', icon: <HourglassEmptyIcon /> },
    ];
    return (<Box>
      {/* ── Page header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{
            fontFamily: '"Nunito", sans-serif',
            fontWeight: 800, fontSize: { xs: '1.7rem', sm: '2.1rem' },
            color: '#e63946', letterSpacing: 0.3,
        }}>
          Absences
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Track and review student absences
        </Typography>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {statCards.map(s => (<Grid size={{ xs: 12, sm: 3 }} key={s.label}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 2.5 }}>
                {loading ? <Skeleton height={60}/> : (<Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{
                    bgcolor: s.color === 'primary.main' ? 'rgba(223,21,17,0.15)' : `${s.color}18`,
                    width: 50, height: 50, flexShrink: 0,
                    border: `1.5px solid ${s.color === 'primary.main' ? 'rgba(255,2,2,0.3)' : `${s.color}30`}`,
                }}>
                      <Box sx={{ color: s.color, display: 'flex' }}>{s.icon}</Box>
                    </Avatar>
                    <Box>
                      <Typography sx={{
                    fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary',
                    textTransform: 'uppercase', letterSpacing: 0.8,
                }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{
                    fontFamily: '"Nunito", sans-serif',
                    fontWeight: 800, fontSize: '2.2rem', color: s.color, lineHeight: 1.1,
                }}>
                        {s.value}
                      </Typography>
                    </Box>
                  </Box>)}
              </CardContent>
            </Card>
          </Grid>))}
      </Grid>

      {/* ── Tabs ── */}
      <Card sx={{ borderRadius: '14px', mb: 2.5 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{
            px: 2, pt: 1,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.9rem' },
            '& .Mui-selected': { color: '#e63946 !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#e63946' },
        }}>
          <Tab icon={<EventBusyIcon sx={{ fontSize: 18 }}/>} iconPosition="start" label="Absence Records"/>
          <Tab icon={<AssignmentIcon sx={{ fontSize: 18 }}/>} iconPosition="start" label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                Absence Reasons
                {pendingReasons > 0 && (<Chip label={pendingReasons} size="small" sx={{
                    height: 18, fontSize: '0.68rem', fontWeight: 800,
                    bgcolor: '#8b5cf6', color: '#fff',
                    '& .MuiChip-label': { px: '6px' },
                }}/>)}
              </Box>}/>
        </Tabs>
      </Card>

      {/* ══════════ TAB 0 — Absence Records ══════════ */}
      {activeTab === 0 && (<>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

          {/* Filter bar */}
          <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterAltIcon fontSize="small" sx={{ color: '#e63946' }}/>
                    <Typography sx={{ fontWeight: 700, color: '#e63946', fontSize: '0.9rem' }}>Filters</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField type="date" label="Filter by Date" fullWidth size="small" value={filterDate} onChange={e => handleDateChange(e.target.value)} slotProps={{ inputLabel: { shrink: true } }}/>
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField placeholder="Search student name…" fullWidth size="small" value={search} onChange={e => setSearch(e.target.value)} slotProps={{
                input: {
                    startAdornment: (<InputAdornment position="start">
                            <SearchIcon fontSize="small"/>
                          </InputAdornment>),
                },
            }}/>
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
                {loading ? (<Box sx={{ p: 3 }}>
                    {[...Array(6)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }}/>)}
                  </Box>) : (<Table>
                    <TableHead>
                      <TableRow>
                        {['Student Name', 'LRN', 'Gender', 'Date', 'Session', 'Status', 'Actions'].map(h => (<TableCell key={h}>{h}</TableCell>))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayed.length === 0 ? (<TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                            <EventBusyIcon sx={{ fontSize: 52, color: 'action.disabled', display: 'block', mx: 'auto', mb: 1 }}/>
                            <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              {filterDate || search ? 'No results match your filters' : 'No absence records yet'}
                            </Typography>
                            {filterDate && (<Typography sx={{ color: 'text.disabled', fontSize: '0.82rem', mt: 0.5 }}>
                                No absences recorded for {filterDate}
                              </Typography>)}
                          </TableCell>
                        </TableRow>) : displayed.map((r, i) => (<TableRow key={i}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <StudentAvatar studentName={r.student_name} photoCache={photoCache} onPhotoClick={(name, url) => setPhotoDialog({ name, url })}/>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'text.primary' }}>
                                {r.student_name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', fontFamily: '"Nunito", sans-serif' }}>
                            {r.lrn || '—'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{r.gender || '—'}</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.date}</TableCell>
                          <TableCell sx={{ fontSize: '0.85rem' }}>{r.session}</TableCell>
                          <TableCell>
                            <Chip label="Absent" color="error" size="small" sx={{ fontWeight: 700 }}/>
                          </TableCell>
                          <TableCell>
                            <Tooltip title="Edit record">
                              <IconButton size="small" onClick={() => openEdit(r)} sx={{
                        color: '#f59e0b !important',
                        bgcolor: 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        '&:hover': { bgcolor: 'rgba(245,158,11,0.2)' },
                    }}>
                                <EditIcon sx={{ fontSize: 16 }}/>
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>))}
                    </TableBody>
                  </Table>)}
              </Box>
              {!loading && displayed.length > 0 && (<Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {displayed.length} absence record{displayed.length !== 1 ? 's' : ''}
                    {filterDate ? ` for ${filterDate}` : ''}
                  </Typography>
                </Box>)}
            </CardContent>
          </Card>
        </>)}

      {/* ══════════ TAB 1 — Absence Reasons ══════════ */}
      {activeTab === 1 && (<>
          {reasonsError && <Alert severity="error" onClose={() => setReasonsError('')} sx={{ mb: 2 }}>{reasonsError}</Alert>}
          {reasonsSuccess && <Alert severity="success" onClose={() => setReasonsSuccess('')} sx={{ mb: 2 }}>{reasonsSuccess}</Alert>}

          {/* Filter bar */}
          <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 'auto' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterAltIcon fontSize="small" sx={{ color: '#8b5cf6' }}/>
                    <Typography sx={{ fontWeight: 700, color: '#8b5cf6', fontSize: '0.9rem' }}>Filters</Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField type="date" label="Filter by Date" fullWidth size="small" value={reasonDate} onChange={e => setReasonDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }}/>
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <TextField select label="Status" fullWidth size="small" value={reasonStatus} onChange={e => setReasonStatus(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField placeholder="Search student or submitted by…" fullWidth size="small" value={reasonSearch} onChange={e => setReasonSearch(e.target.value)} slotProps={{
                input: {
                    startAdornment: (<InputAdornment position="start">
                            <SearchIcon fontSize="small"/>
                          </InputAdornment>),
                },
            }}/>
                </Grid>
                <Grid size={{ xs: 6, sm: 'auto' }}>
                  <Button variant="contained" size="small" onClick={handleReasonFilter} sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                    Apply
                  </Button>
                </Grid>
                <Grid size={{ xs: 6, sm: 'auto' }}>
                  <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={handleReasonClear}>
                    Clear
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Reasons table */}
          <Card sx={{ borderRadius: '14px' }}>
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
              <Box sx={{ overflowX: 'auto' }}>
                {reasonsLoading ? (<Box sx={{ p: 3 }}>
                    {[...Array(5)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }}/>)}
                  </Box>) : (<Table>
                    <TableHead>
                      <TableRow>
                        {['Student Name', 'LRN', 'Reason', 'Date', 'Submitted By', 'Contact', 'Status', 'Actions'].map(h => (<TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredReasons.length === 0 ? (<TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                            <AssignmentIcon sx={{ fontSize: 52, color: 'action.disabled', display: 'block', mx: 'auto', mb: 1 }}/>
                            <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                              No absence reasons found
                            </Typography>
                          </TableCell>
                        </TableRow>) : filteredReasons.map(r => {
                    const sc = reasonStatusColor(r.status);
                    return (<TableRow key={r.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <StudentAvatar studentName={r.student_name} photoCache={photoCache} onPhotoClick={(name, url) => setPhotoDialog({ name, url })}/>
                                <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>
                                  {r.student_name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', fontFamily: 'monospace' }}>
                              {r.lrn || '—'}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 260 }}>
                              <Typography sx={{ fontSize: '0.85rem', lineHeight: 1.4 }}>
                                {r.reason}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                              {r.date}
                            </TableCell>
                            <TableCell sx={{ fontSize: '0.85rem' }}>{r.submitted_by || '—'}</TableCell>
                            <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                              {r.parent_contact || '—'}
                            </TableCell>
                            <TableCell>
                              <Chip label={r.status.charAt(0).toUpperCase() + r.status.slice(1)} size="small" sx={{
                            fontWeight: 700, fontSize: '0.75rem',
                            color: sc.color,
                            bgcolor: sc.bg,
                            border: `1px solid ${sc.border}`,
                        }}/>
                            </TableCell>
                            <TableCell>
                              {r.status === 'pending' ? (<Box sx={{ display: 'flex', gap: 0.75 }}>
                                  <Tooltip title="Approve">
                                    <span>
                                      <IconButton size="small" disabled={updatingId === r.id} onClick={() => updateReasonStatus(r.id, 'approved')} sx={{
                                color: '#16a34a',
                                bgcolor: 'rgba(22,163,74,0.08)',
                                border: '1px solid rgba(22,163,74,0.25)',
                                '&:hover': { bgcolor: 'rgba(22,163,74,0.18)' },
                            }}>
                                        {updatingId === r.id
                                ? <CircularProgress size={14} color="inherit"/>
                                : <CheckCircleIcon sx={{ fontSize: 16 }}/>}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                  <Tooltip title="Reject">
                                    <span>
                                      <IconButton size="small" disabled={updatingId === r.id} onClick={() => updateReasonStatus(r.id, 'rejected')} sx={{
                                color: '#e63946',
                                bgcolor: 'rgba(230,57,70,0.08)',
                                border: '1px solid rgba(230,57,70,0.25)',
                                '&:hover': { bgcolor: 'rgba(230,57,70,0.18)' },
                            }}>
                                        <CloseIcon sx={{ fontSize: 16 }}/>
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </Box>) : (<Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', fontStyle: 'italic' }}>
                                  Reviewed
                                </Typography>)}
                            </TableCell>
                          </TableRow>);
                })}
                    </TableBody>
                  </Table>)}
              </Box>
              {!reasonsLoading && filteredReasons.length > 0 && (<Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {filteredReasons.length} reason{filteredReasons.length !== 1 ? 's' : ''} found
                    {' · '}
                    {reasons.filter(r => r.status === 'pending').length} pending
                    {' · '}
                    {reasons.filter(r => r.status === 'approved').length} approved
                  </Typography>
                </Box>)}
            </CardContent>
          </Card>
        </>)}

      {/* ── Edit dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, pb: 1, color: '#e63946', letterSpacing: 0.3 }}>
          Edit Absence Record
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Student Name *" fullWidth value={form.student_name} onChange={setF('student_name')} autoFocus/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="LRN" fullWidth value={form.lrn} onChange={setF('lrn')}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="Gender" fullWidth value={form.gender} onChange={setF('gender')}>
                <MenuItem value="">— Not specified —</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField type="date" label="Date" fullWidth value={form.date} onChange={setF('date')} slotProps={{ inputLabel: { shrink: true } }}/>
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
              <TextField label="Guardian Name" fullWidth value={form.guardian_name} onChange={setF('guardian_name')}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="By Whom" fullWidth value={form.by_whom} onChange={setF('by_whom')} helperText="Who dropped off / picked up"/>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !form.student_name.trim()} startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <SaveIcon />} sx={{ px: 3, bgcolor: '#e63946', '&:hover': { bgcolor: '#c62828' } }}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Photo dialog ── */}
      <Dialog open={photoDialog !== null} onClose={() => setPhotoDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, fontWeight: 700, fontSize: '1rem' }}>
          {photoDialog?.name}
          <IconButton size="small" onClick={() => setPhotoDialog(null)}>
            <CloseIcon fontSize="small"/>
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {photoDialog && (<Box component="img" src={photoDialog.url} alt={photoDialog.name} sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: '#f8fafc' }}/>)}
        </DialogContent>
      </Dialog>
    </Box>);
}
