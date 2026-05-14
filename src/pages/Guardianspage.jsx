import { useEffect, useState, useRef } from 'react';
import { Box, Grid, Card, CardContent, Typography, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Skeleton, InputAdornment, Avatar, Tooltip, IconButton, ToggleButtonGroup, ToggleButton, } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SaveIcon from '@mui/icons-material/Save';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { guardiansAPI, scanPhotosAPI } from '../api';
const BACKEND_URL = import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : 'http://localhost:5000';
/* ─── Photo fetcher ─────────────────────────────────────────────────── */
async function fetchGuardianPhoto(guardianName, studentName, cache) {
    const cacheKey = guardianName;
    if (Object.prototype.hasOwnProperty.call(cache.current, cacheKey))
        return cache.current[cacheKey];
    for (const name of [guardianName, studentName]) {
        if (!name?.trim())
            continue;
        try {
            const { data } = await scanPhotosAPI.getAll(name);
            const scan = data.find(p => p.status?.toLowerCase().replace(/[-_\s]/g, '') === 'guardianregistration');
            if (!scan?.photo_path)
                continue;
            const photoPath = scan.photo_path.startsWith('http')
                ? scan.photo_path : `${BACKEND_URL}${scan.photo_path}`;
            const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
            const res = await fetch(photoPath, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
            if (!res.ok)
                continue;
            const url = URL.createObjectURL(await res.blob());
            cache.current[cacheKey] = url;
            return url;
        }
        catch {
            continue;
        }
    }
    cache.current[cacheKey] = null;
    return null;
}
/* ─── GuardianAvatar ────────────────────────────────────────────────── */
function GuardianAvatar({ guardianName, studentName, photoCache, onPhotoClick, }) {
    const [photo, setPhoto] = useState(null);
    const [imgErr, setImgErr] = useState(false);
    useEffect(() => {
        setImgErr(false);
        let cancelled = false;
        fetchGuardianPhoto(guardianName, studentName, photoCache)
            .then(p => { if (!cancelled)
            setPhoto(p); });
        return () => { cancelled = true; };
    }, [guardianName, studentName]);
    const baseSx = { width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 };
    if (photo && !imgErr) {
        return (<Avatar src={photo} alt={guardianName} sx={{ ...baseSx, bgcolor: 'transparent', cursor: 'pointer',
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': { transform: 'scale(1.12)', boxShadow: '0 0 0 2px #6366f1' },
            }} onClick={() => onPhotoClick(guardianName, photo)} onError={() => setImgErr(true)}/>);
    }
    return (<Avatar sx={{ ...baseSx, bgcolor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}>
      {guardianName?.charAt(0)?.toUpperCase() ?? '?'}
    </Avatar>);
}
/* ─── Status chip (read-only, shows parent's decision) ──────────────── */
function StatusChip({ status }) {
    const s = (status?.toLowerCase()) ?? 'pending';
    const cfg = {
        approved: { label: 'Approved by Parent', color: '#16a34a', bg: 'rgba(34,197,94,0.12)', icon: <CheckCircleIcon sx={{ fontSize: 14 }}/> },
        denied: { label: 'Denied by Parent', color: '#dc2626', bg: 'rgba(220,38,38,0.12)', icon: <CancelIcon sx={{ fontSize: 14 }}/> },
        pending: { label: 'Awaiting Parent', color: '#d97706', bg: 'rgba(245,158,11,0.12)', icon: <HourglassEmptyIcon sx={{ fontSize: 14 }}/> },
    }[s] ?? { label: 'Awaiting Parent', color: '#d97706', bg: 'rgba(245,158,11,0.12)', icon: <HourglassEmptyIcon sx={{ fontSize: 14 }}/> };
    return (<Chip icon={<Box sx={{ color: cfg.color, display: 'flex', ml: '6px !important' }}>{cfg.icon}</Box>} label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: '0.72rem',
            border: `1px solid ${cfg.color}40` }}/>);
}
/* ─── Empty form ────────────────────────────────────────────────────── */
const EMPTY = { name: '', age: '', address: '', relationship: '', contact: '', student_name: '' };
/* ════════════════════════════════════════════════════════════════════════
   GuardiansPage  —  teacher view (read-only approval status)
════════════════════════════════════════════════════════════════════════ */
export default function GuardiansPage() {
    const photoCache = useRef({});
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY });
    const [photoDialog, setPhotoDialog] = useState(null);
    const setF = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
    const load = () => {
        guardiansAPI.getAll()
            .then(r => setRows(r.data))
            .catch(() => setError('Failed to load guardian records.'))
            .finally(() => setLoading(false));
    };
    useEffect(load, []);
    const save = async () => {
        if (!form.name.trim()) {
            setError('Guardian name is required.');
            return;
        }
        if (!form.student_name.trim()) {
            setError('Student name is required.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await guardiansAPI.create({
                name: form.name.trim(), age: form.age ? Number(form.age) : undefined,
                address: form.address.trim() || undefined,
                relationship: form.relationship.trim() || undefined,
                contact: form.contact.trim() || undefined,
                student_name: form.student_name.trim(),
            });
            setSuccess('Guardian registered!');
            setDialogOpen(false);
            load();
        }
        catch (e) {
            setError(e.response?.data?.error ?? 'Failed to save guardian.');
        }
        finally {
            setSaving(false);
        }
    };
    const counts = {
        all: rows.length,
        pending: rows.filter(r => !r.approval_status || r.approval_status === 'pending').length,
        approved: rows.filter(r => r.approval_status === 'approved').length,
        denied: rows.filter(r => r.approval_status === 'denied').length,
    };
    const displayed = rows.filter(r => {
        const matchSearch = !search ||
            [r.name, r.student_name, r.contact, r.relationship]
                .some(v => v?.toLowerCase().includes(search.toLowerCase()));
        const matchStatus = statusFilter === 'all' ? true :
            statusFilter === 'pending' ? (!r.approval_status || r.approval_status === 'pending') :
                r.approval_status === statusFilter;
        return matchSearch && matchStatus;
    });
    return (<Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontFamily: '"Nunito", sans-serif', fontWeight: 800,
            fontSize: { xs: '1.7rem', sm: '2.1rem' }, color: '#6366f1', letterSpacing: 0.3,
        }}>
            Guardians
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Parent-verified pickup authorization
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ ...EMPTY }); setError(''); setDialogOpen(true); }} sx={{ px: 3, py: 1.2, borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.30)',
            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #4338ca)' },
        }}>
          Add Guardian
        </Button>
      </Box>

      {/* Info banner — teacher is read-only */}
      <Alert icon={<InfoOutlinedIcon fontSize="small"/>} severity="info" sx={{ mb: 2.5, borderRadius: '12px', fontSize: '0.83rem' }}>
        Approval status is set by parents on the mobile app. This view is read-only.
      </Alert>

      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {[
            { label: 'Total', value: counts.all, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', icon: <PeopleIcon sx={{ color: '#6366f1' }}/> },
            { label: 'Approved', value: counts.approved, color: '#16a34a', bg: 'rgba(34,197,94,0.12)', icon: <CheckCircleIcon sx={{ color: '#16a34a' }}/> },
            { label: 'Pending', value: counts.pending, color: '#d97706', bg: 'rgba(245,158,11,0.12)', icon: <HourglassEmptyIcon sx={{ color: '#d97706' }}/> },
            { label: 'Denied', value: counts.denied, color: '#dc2626', bg: 'rgba(220,38,38,0.12)', icon: <CancelIcon sx={{ color: '#dc2626' }}/> },
        ].map(s => (<Grid size={{ xs: 6, sm: 3 }} key={s.label}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent sx={{ p: 2.5 }}>
                {loading ? <Skeleton height={60}/> : (<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: s.bg, width: 44, height: 44, border: `1.5px solid ${s.color}30` }}>
                      {s.icon}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                        {s.label}
                      </Typography>
                      <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.9rem', color: s.color, lineHeight: 1.1 }}>
                        {s.value}
                      </Typography>
                    </Box>
                  </Box>)}
              </CardContent>
            </Card>
          </Grid>))}
      </Grid>

      {/* Search + Filter */}
      <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField placeholder="Search by name, student, contact…" fullWidth size="small" value={search} onChange={e => setSearch(e.target.value)} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small"/></InputAdornment> } }}/>
            </Grid>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <ToggleButtonGroup value={statusFilter} exclusive onChange={(_, v) => v && setStatusFilter(v)} size="small" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {[
            { v: 'all', label: `All (${counts.all})` },
            { v: 'pending', label: `⏳ Awaiting (${counts.pending})` },
            { v: 'approved', label: `✅ Approved (${counts.approved})` },
            { v: 'denied', label: `❌ Denied (${counts.denied})` },
        ].map(({ v, label }) => (<ToggleButton key={v} value={v} sx={{
                borderRadius: '8px !important', textTransform: 'none',
                fontWeight: 600, fontSize: '0.75rem', px: 1.5,
                ...(v === 'approved' && { '&.Mui-selected': { bgcolor: 'rgba(34,197,94,0.15)', color: '#16a34a', borderColor: '#16a34a40' } }),
                ...(v === 'denied' && { '&.Mui-selected': { bgcolor: 'rgba(220,38,38,0.15)', color: '#dc2626', borderColor: '#dc262640' } }),
                ...(v === 'pending' && { '&.Mui-selected': { bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', borderColor: '#d9770640' } }),
            }}>
                    {label}
                  </ToggleButton>))}
              </ToggleButtonGroup>
            </Grid>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Button variant="outlined" size="small" startIcon={<ClearIcon />} onClick={() => { setSearch(''); setStatusFilter('all'); }}>
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
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }}/>)}
              </Box>) : (<Table>
                <TableHead>
                  <TableRow>
                    {['Guardian', 'Age', 'Relationship', 'Contact', 'Student', 'Address', 'Parent Decision'].map(h => (<TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayed.length === 0 ? (<TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                        <PeopleIcon sx={{ fontSize: 52, color: 'action.disabled', display: 'block', mx: 'auto', mb: 1 }}/>
                        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {search ? 'No results match your search' : 'No guardian records yet'}
                        </Typography>
                      </TableCell>
                    </TableRow>) : displayed.map(r => (<TableRow key={r.id} sx={{
                    opacity: r.approval_status === 'denied' ? 0.65 : 1,
                    transition: 'opacity 0.2s',
                    // green tint row for approved
                    ...(r.approval_status === 'approved' && {
                        bgcolor: 'rgba(34,197,94,0.03)',
                    }),
                }}>
                      {/* Guardian + avatar */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <GuardianAvatar guardianName={r.name} studentName={r.student_name} photoCache={photoCache} onPhotoClick={(name, url) => setPhotoDialog({ name, url })}/>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.88rem' }}>{r.name}</Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.85rem' }}>{r.age || '—'}</TableCell>

                      <TableCell>
                        {r.relationship
                    ? <Chip label={r.relationship} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1',
                            fontWeight: 600, fontSize: '0.72rem',
                            border: '1px solid rgba(99,102,241,0.3)' }}/>
                    : '—'}
                      </TableCell>

                      <TableCell>
                        {r.contact
                    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PhoneIcon sx={{ fontSize: 14, color: 'text.disabled' }}/>
                              <Typography sx={{ fontSize: '0.85rem' }}>{r.contact}</Typography>
                            </Box>
                    : '—'}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1.5, py: 0.5, borderRadius: '8px',
                    bgcolor: 'rgba(245,158,11,0.12)',
                    border: '1px solid rgba(245,158,11,0.3)' }}>
                          <SchoolIcon sx={{ fontSize: 14, color: '#f59e0b' }}/>
                          <Typography sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#f59e0b' }}>
                            {r.student_name}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 180 }}>
                        {r.address
                    ? <Tooltip title={r.address}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <HomeIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }}/>
                                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {r.address}
                                </Typography>
                              </Box>
                            </Tooltip>
                    : '—'}
                      </TableCell>

                      {/* Parent's decision — read-only */}
                      <TableCell>
                        <StatusChip status={r.approval_status}/>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </Box>

          {!loading && displayed.length > 0 && (<Box sx={{ px: 3, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                {displayed.length} guardian{displayed.length !== 1 ? 's' : ''}
                {statusFilter !== 'all' ? ` · filtered by ${statusFilter}` : ''}
              </Typography>
            </Box>)}
        </CardContent>
      </Card>

      {/* Add Guardian Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, pb: 1, color: '#6366f1', letterSpacing: 0.3 }}>
          Register Guardian
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}><TextField label="Guardian Full Name *" fullWidth value={form.name} onChange={setF('name')} autoFocus/></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Age" fullWidth type="number" value={form.age} onChange={setF('age')} slotProps={{ htmlInput: { min: 0, max: 120 } }}/></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField label="Relationship" fullWidth value={form.relationship} onChange={setF('relationship')} placeholder="e.g. Parent, Guardian, Grandparent"/></Grid>
            <Grid size={{ xs: 12 }}><TextField label="Contact Number" fullWidth value={form.contact} onChange={setF('contact')}/></Grid>
            <Grid size={{ xs: 12 }}><TextField label="Student Name *" fullWidth value={form.student_name} onChange={setF('student_name')} helperText="Full name of the student this guardian is linked to"/></Grid>
            <Grid size={{ xs: 12 }}><TextField label="Home Address" fullWidth value={form.address} onChange={setF('address')}/></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !form.name.trim() || !form.student_name.trim()} startIcon={saving ? <CircularProgress size={16} color="inherit"/> : <SaveIcon />} sx={{ px: 3, background: 'linear-gradient(135deg, #6366f1, #4f46e5)', '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #4338ca)' } }}>
            Save Guardian
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo dialog */}
      <Dialog open={photoDialog !== null} onClose={() => setPhotoDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, fontWeight: 700, fontSize: '1rem' }}>
          {photoDialog?.name}
          <IconButton size="small" onClick={() => setPhotoDialog(null)}><CloseIcon fontSize="small"/></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {photoDialog && (<Box component="img" src={photoDialog.url} alt={photoDialog.name} sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block', background: '#f8fafc' }}/>)}
        </DialogContent>
      </Dialog>
    </Box>);
}
