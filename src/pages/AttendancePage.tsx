import { useEffect, useState, useContext, useRef } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, MenuItem, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, CircularProgress,
  Tooltip, Skeleton, InputAdornment, Avatar, Divider,
} from '@mui/material';
import AddIcon            from '@mui/icons-material/Add';
import EditIcon           from '@mui/icons-material/Edit';
import DeleteIcon         from '@mui/icons-material/Delete';
import SearchIcon         from '@mui/icons-material/Search';
import SaveIcon           from '@mui/icons-material/Save';
import FilterAltIcon      from '@mui/icons-material/FilterAlt';
import ClearIcon          from '@mui/icons-material/Clear';
import ChecklistIcon      from '@mui/icons-material/Checklist';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CancelIcon         from '@mui/icons-material/Cancel';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import ArrowDownwardIcon  from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon    from '@mui/icons-material/ArrowUpward';
import CloseIcon          from '@mui/icons-material/Close';
import QrCode2Icon        from '@mui/icons-material/QrCode2';
import DownloadIcon       from '@mui/icons-material/Download';
import UploadFileIcon     from '@mui/icons-material/UploadFile';
import FileDownloadIcon   from '@mui/icons-material/FileDownload';
import TableChartIcon     from '@mui/icons-material/TableChart';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { attendanceAPI, scanPhotosAPI } from '../api';
import { ColorModeContext } from '../components/layout';

/* ─────────── Backend base URL ─────────────────────────────────────────── */
const BACKEND_URL =
  (import.meta as any).env?.VITE_API_URL
    ? ((import.meta as any).env.VITE_API_URL as string).replace('/api', '')
    : 'http://localhost:5000';

const API_BASE = `${BACKEND_URL}/api`;

/* ─────────── Always returns today's date in YYYY-MM-DD using LOCAL time ──
   Using toISOString() gives UTC which can be a day behind in PH (UTC+8).  */
const getLocalDateStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ─────────── Format a time string (HH:MM:SS or ISO datetime) to 12-hr ── */
const fmtTime = (t: string | null | undefined): string => {
  if (!t) return '—';
  // ISO datetime (e.g. "2024-04-28T08:30:00.000Z") → let Date parse it so the
  // browser converts UTC → local (PH = UTC+8) automatically.
  if (t.includes('T')) {
    const d = new Date(t);
    if (isNaN(d.getTime())) return '—';
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  }
  // Plain "HH:MM:SS" — already local time straight from DB
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '—';
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

/* ─────────── Status helpers ─────────── */
const STATUSES = ['Present', 'Absent', 'Late', 'DROP-OFF', 'PICK-UP', 'Dropped Out'];

const normalizeStatus = (s: string) => (s ?? '').toLowerCase().replace(/[-_\s]/g, '');

const isDropOff = (s: string) => normalizeStatus(s) === 'dropoff';
const isPickUp  = (s: string) => normalizeStatus(s) === 'pickup';
const isAbsent  = (s: string) => normalizeStatus(s) === 'absent';
const isPresent = (s: string) => normalizeStatus(s) === 'present';
const isLate    = (s: string) => normalizeStatus(s) === 'late';

const chipColor = (s: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  const n = normalizeStatus(s);
  if (n === 'present')    return 'success';
  if (n === 'absent')     return 'error';
  if (n === 'late')       return 'warning';
  if (n === 'dropoff')    return 'info';
  if (n === 'pickup')     return 'info';
  if (n === 'droppedout') return 'default';
  return 'default';
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

/* ─────────── Empty form — uses local date so PH users get the right day ── */
const makeEmptyForm = () => ({
  student_name:  '',
  lrn:           '',
  gender:        '',
  status:        'Present',
  session:       'AM',
  date:          getLocalDateStr(),   // ← local date, not UTC
  guardian_name: '',
  by_whom:       '',
});

/* ─────────── Theme-aware style helpers ─────────── */
const cardSx = (dark: boolean) => ({
  borderRadius: '14px',
  background: dark ? '#1e293b' : '#ffffff',
  border: `1px solid ${dark ? 'rgba(56,197,134,0.15)' : '#ffffff'}`,
  boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
});

const labelSx = (dark: boolean) => ({
  fontFamily: '"Nunito", sans-serif',
  fontWeight: 800,
  fontSize: { xs: '1.55rem', sm: '1.9rem' },
  color: dark ? '#4ade80' : '#2d5016',
  lineHeight: 1,
});

const subLabelSx = (dark: boolean) => ({
  color: dark ? '#64748b' : '#6b7280',
  fontWeight: 500,
  fontSize: '0.85rem',
  mt: 0.25,
});

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

    if (!scan?.photo_path) {
      cache.current[studentName] = null;
      return null;
    }

    const photoPath = scan.photo_path.startsWith('http')
      ? scan.photo_path
      : `${BACKEND_URL}${scan.photo_path}`;

    /* ── Fetch as blob to avoid ERR_BLOCKED_BY_RESPONSE.NotSameOrigin ── */
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(photoPath, { headers });
    if (!res.ok) {
      cache.current[studentName] = null;
      return null;
    }
    const blob    = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    cache.current[studentName] = blobUrl;
    return blobUrl;
  } catch {
    cache.current[studentName] = null;
    return null;
  }
}

/* ─────────── QR Code helpers ─────────── */
function getQrImageUrl(content: string, size: number = 300): string {
  const encoded = encodeURIComponent(content);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=10`;
}

async function downloadQrCode(studentName: string, qrData: string): Promise<void> {
  const url = getQrImageUrl(qrData, 400);
  try {
    const response = await fetch(url);
    const blob     = await response.blob();
    const blobUrl  = URL.createObjectURL(blob);
    const link     = document.createElement('a');
    link.href      = blobUrl;
    const safeName = studentName.replace(/[^a-z0-9_\- ]/gi, '').trim().replace(/\s+/g, '_');
    link.download  = `QR_${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(url, '_blank');
  }
}

/* ─────────── CSV helpers ─────────── */
function convertToCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = ['Student Name', 'LRN', 'Gender', 'Date', 'Time', 'Session', 'Status', 'Guardian Name', 'By Whom'];
  const rows = data.map(r =>
    [
      r.student_name  ?? '',
      r.lrn           ?? '',
      r.gender        ?? '',
      r.date          ?? '',
      fmtTime(r.time_in ?? r.created_at),
      r.session       ?? '',
      r.status        ?? '',
      r.guardian_name ?? '',
      r.by_whom       ?? '',
    ].map(f => {
      const s = String(f);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function downloadBlob(blob: Blob, filename: string) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─────────── StudentAvatar ─────────── */
interface StudentAvatarProps {
  studentName: string;
  dark: boolean;
  photoCache: React.MutableRefObject<Record<string, string | null>>;
  onPhotoClick: (name: string, url: string) => void;
}

function StudentAvatar({ studentName, dark, photoCache, onPhotoClick }: StudentAvatarProps) {
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
    width: 34,
    height: 34,
    fontSize: '0.78rem',
    fontWeight: 800,
    flexShrink: 0,
    border: `1.5px solid ${dark ? 'rgba(56,197,134,0.35)' : 'rgba(45,80,22,0.22)'}`,
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
          '&:hover': {
            transform: 'scale(1.12)',
            boxShadow: dark ? '0 0 0 2px #38c586' : '0 0 0 2px #2d5016',
          },
          '& img': { objectFit: 'cover', width: '100%', height: '100%' },
        }}
        onClick={() => onPhotoClick(studentName, photoPath)}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <Avatar
      sx={{
        ...baseSx,
        bgcolor: dark ? 'rgba(56,197,134,0.12)' : 'rgba(45,80,22,0.1)',
        color: dark ? '#38c586' : '#2d5016',
      }}
    >
      {initial}
    </Avatar>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   AttendancePage
════════════════════════════════════════════════════════════════════════ */
export default function AttendancePage() {
  const { mode } = useContext(ColorModeContext);
  const dark = mode === 'dark';

  const photoCache = useRef<Record<string, string | null>>({});

  const [rows,       setRows]       = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');

  // ── filterDate initialised with LOCAL date so PH users see today correctly ──
  const [filterDate, setFilterDate] = useState(getLocalDateStr());
  const [filterSt,   setFilterSt]   = useState('');
  const [search,     setSearch]     = useState('');
  const [editId,     setEditId]     = useState<number | null>(null);
  const [form,       setForm]       = useState(makeEmptyForm());
  const [deleteId,   setDeleteId]   = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [photoDialog,   setPhotoDialog]   = useState<{ name: string; url: string } | null>(null);
  const [qrDialog,      setQrDialog]      = useState<{ name: string; qrData: string } | null>(null);
  const [qrDownloading, setQrDownloading] = useState(false);

  /* ── SF2 state ── */
  const [csvStatusFilter,  setCsvStatusFilter]  = useState('drop-off');
  const [csvMsg,           setCsvMsg]           = useState('');
  const [csvErr,           setCsvErr]           = useState('');
  const [sf2TemplateFile,  setSf2TemplateFile]  = useState<File | null>(null);
  const [sf2Month,         setSf2Month]         = useState(String(new Date().getMonth() + 1));
  const [sf2Year,          setSf2Year]          = useState(String(new Date().getFullYear()));
  const [sf2Loading,       setSf2Loading]       = useState(false);
  const [sf2Msg,           setSf2Msg]           = useState('');
  const [sf2Err,           setSf2Err]           = useState('');
  const sf2FileRef = useRef<HTMLInputElement>(null);

  const setF = (k: keyof ReturnType<typeof makeEmptyForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  /* ── Load ── */
  const load = async (date?: string) => {
    setLoading(true);
    try {
      const { data } = await attendanceAPI.getAll(date || undefined);
      setRows(data);
    } catch {
      setError('Failed to load records.');
    } finally {
      setLoading(false);
    }
  };

  // ── On mount: load today's records using LOCAL date (fixes UTC-offset bug) ──
  useEffect(() => { load(getLocalDateStr()); }, []);

  /* ── Dialog helpers ── */
  const openAdd = () => {
    setEditId(null);
    setForm({ ...makeEmptyForm(), date: filterDate || getLocalDateStr() });
    setDialogOpen(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      student_name:  r.student_name  ?? '',
      lrn:           r.lrn           ?? '',
      gender:        (r.gender != null && r.gender !== '') ? r.gender : '',
      status:        canonicalStatus(r.status ?? 'Present'),
      session:       r.session       ?? 'AM',
      date:          r.date          ?? '',
      guardian_name: r.guardian_name ?? '',
      by_whom:       r.by_whom       ?? '',
    });
    setDialogOpen(true);
  };

  /* ── QR dialog ── */
  const openQrDialog = (r: any) => {
    if (!r.qr_data) {
      setError('No QR data available for this record.');
      return;
    }
    setQrDialog({ name: r.student_name, qrData: r.qr_data });
  };

  const handleQrDownload = async () => {
    if (!qrDialog) return;
    setQrDownloading(true);
    try {
      await downloadQrCode(qrDialog.name, qrDialog.qrData);
    } finally {
      setQrDownloading(false);
    }
  };

  /* ── Save ── */
  const buildPayload = () => ({
    student_name:  form.student_name,
    lrn:           form.lrn,
    gender:        form.gender,
    status:        form.status,
    session:       form.session,
    date:          form.date,
    guardian_name: form.guardian_name,
    by_whom:       form.by_whom,
  });

  const save = async () => {
    if (!form.student_name.trim()) { setError('Student name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      if (editId !== null) {
        await attendanceAPI.update(editId, buildPayload());
        setSuccess('Record updated successfully!');
      } else {
        await attendanceAPI.create(buildPayload());
        setSuccess('Attendance recorded!');
      }
      setDialogOpen(false);
      load(filterDate || undefined);
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const confirmDelete = async () => {
    if (deleteId === null) return;
    try {
      await attendanceAPI.remove(deleteId);
      setSuccess('Record deleted.');
      setDeleteId(null);
      load(filterDate || undefined);
    } catch {
      setError('Failed to delete.');
      setDeleteId(null);
    }
  };

  /* ── Derived data ── */
  const displayed = rows
    .filter(r => !filterSt || normalizeStatus(r.status) === normalizeStatus(filterSt))
    .filter(r => !search   || r.student_name?.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    present: rows.filter(r => isPresent(r.status)).length,
    absent:  rows.filter(r => isAbsent(r.status)).length,
    late:    rows.filter(r => isLate(r.status)).length,
    dropoff: rows.filter(r => isDropOff(r.status)).length,
    pickup:  rows.filter(r => isPickUp(r.status)).length,
  };

  const iconBtnSx = (color: string, bg: string) => ({
    color,
    bgcolor: bg,
    border: `1px solid ${color}40`,
    '&:hover': { bgcolor: `${bg}cc` },
  });

  /* ── Stat card definitions ── */
  const statCards = [
    {
      label: 'Present',
      value: counts.present,
      color: '#22c55e',
      bg:    dark ? 'rgba(34,197,94,0.08)'   : '#f0fdf4',
      border: dark ? 'rgba(34,197,94,0.2)'   : '#bbf7d0',
      Icon:  CheckCircleIcon,
    },
    {
      label: 'Absent',
      value: counts.absent,
      color: '#e63946',
      bg:    dark ? 'rgba(230,57,70,0.08)'   : '#fef2f2',
      border: dark ? 'rgba(230,57,70,0.2)'   : '#fecaca',
      Icon:  CancelIcon,
    },
    {
      label: 'Late',
      value: counts.late,
      color: '#f59e0b',
      bg:    dark ? 'rgba(245,158,11,0.08)'  : '#fffbeb',
      border: dark ? 'rgba(245,158,11,0.2)'  : '#fde68a',
      Icon:  AccessTimeIcon,
    },
    {
      label: 'Drop-off',
      value: counts.dropoff,
      color: '#3b82f6',
      bg:    dark ? 'rgba(59,130,246,0.08)'  : '#eff6ff',
      border: dark ? 'rgba(59,130,246,0.2)'  : '#bfdbfe',
      Icon:  ArrowDownwardIcon,
    },
    {
      label: 'Pick-up',
      value: counts.pickup,
      color: '#8b5cf6',
      bg:    dark ? 'rgba(139,92,246,0.08)'  : '#f5f3ff',
      border: dark ? 'rgba(139,92,246,0.2)'  : '#ddd6fe',
      Icon:  ArrowUpwardIcon,
    },
  ];

  /* ── SF2 / CSV helpers ── */
  const csvStatusOptions = [
    { value: '',         label: 'All Statuses' },
    { value: 'present',  label: 'Present' },
    { value: 'absent',   label: 'Absent' },
    { value: 'late',     label: 'Late' },
    { value: 'drop-off', label: 'Drop-Off' },
    { value: 'pick-up',  label: 'Pick-Up' },
  ];

  const monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ].map((m, i) => ({ value: String(i + 1), label: m }));

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({
    value: String(y), label: String(y),
  }));

  const handleExportCSV = () => {
    setCsvErr('');
    setCsvMsg('');

    let data = [...rows];

    const dateKey = filterDate || getLocalDateStr();
    if (dateKey) data = data.filter(r => r.date === dateKey);

    if (csvStatusFilter) {
      data = data.filter(r => {
        const n = normalizeStatus(r.status);
        const t = normalizeStatus(csvStatusFilter);
        if (t === 'dropoff') return n === 'dropoff';
        if (t === 'pickup')  return n === 'pickup';
        return n === t;
      });
    }

    // mirror vanilla: exclude absent + dropped-out from CSV
    data = data.filter(r => {
      const n = normalizeStatus(r.status);
      return n !== 'absent' && n !== 'droppedout';
    });

    // deduplicate
    const seen = new Set<string>();
    data = data.filter(r => {
      const key = `${r.student_name}_${r.date}_${r.status}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!data.length) {
      setCsvErr('No records to export. Adjust the status filter.');
      return;
    }

    data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const csv  = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const now  = getLocalDateStr();

    let filename = `Attendance_Report_${now}.csv`;
    if (dateKey && csvStatusFilter) filename = `Attendance_${csvStatusFilter}_${dateKey}.csv`;
    else if (dateKey)               filename = `Attendance_${dateKey}.csv`;
    else if (csvStatusFilter)       filename = `Attendance_${csvStatusFilter}_${now}.csv`;

    downloadBlob(blob, filename);
    setCsvMsg(`${data.length} record(s) exported successfully.`);
  };

  const handleSf2FileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setSf2TemplateFile(null); return; }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls'].includes(ext ?? '')) {
      setSf2Err('Please upload a valid Excel file (.xlsx or .xls).');
      setSf2TemplateFile(null);
      return;
    }
    setSf2Err('');
    setSf2Msg('');
    setSf2TemplateFile(file);
  };

  const handleGenerateSF2 = async () => {
    if (!sf2TemplateFile) { setSf2Err('Please upload an SF2 template file first.'); return; }
    setSf2Err('');
    setSf2Msg('');
    setSf2Loading(true);
    try {
      const formData = new FormData();
      formData.append('template_file', sf2TemplateFile);
      formData.append('month', sf2Month);
      formData.append('year',  sf2Year);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/sf2/generate`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        let msg = `Server error (${res.status})`;
        try { const j = await res.json(); msg = j.error ?? j.message ?? msg; } catch { /* ignore */ }
        throw new Error(msg);
      }

      const blob = await res.blob();
      if (!blob.size) throw new Error('Received empty file from server.');

      const cd       = res.headers.get('Content-Disposition') ?? '';
      const match    = cd.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      const filename = match
        ? match[1].replace(/['"]/g, '')
        : `SF2_Report_${sf2Month}_${sf2Year}.xlsx`;

      downloadBlob(blob, filename);
      setSf2Msg('SF2 report generated and downloaded successfully!');
      setSf2TemplateFile(null);
      if (sf2FileRef.current) sf2FileRef.current.value = '';
    } catch (err: any) {
      setSf2Err(err.message ?? 'Failed to generate SF2 report.');
    } finally {
      setSf2Loading(false);
    }
  };

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <Box>

      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={labelSx(dark)}>Daily Attendance</Typography>
          <Typography sx={subLabelSx(dark)}>Record and manage student attendance</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            px: 3, py: 1.1, borderRadius: '10px', fontWeight: 700,
            background: dark
              ? 'linear-gradient(135deg,#38c586,#2da86e)'
              : 'linear-gradient(135deg,#2d5016,#4a7a25)',
            boxShadow: dark ? '0 4px 14px rgba(56,197,134,0.3)' : '0 4px 14px rgba(45,80,22,0.25)',
            '&:hover': {
              background: dark
                ? 'linear-gradient(135deg,#2da86e,#1e8a5a)'
                : 'linear-gradient(135deg,#3a6420,#5a8a30)',
            },
          }}
        >
          Add Record
        </Button>
      </Box>

      {/* ── Alerts ── */}
      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* ── Stat cards ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {statCards.map(s => (
          <Card
            key={s.label}
            sx={{
              flex: '1 1 0',
              minWidth: 130,
              borderRadius: '14px',
              background: s.bg,
              border: `1px solid ${s.border}`,
              boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
            }}
          >
            <CardContent sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: '18px 20px',
              '&:last-child': { pb: '18px' },
            }}>
              {loading ? (
                <Skeleton variant="circular" width={46} height={46} />
              ) : (
                <Box sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  bgcolor: dark ? `${s.color}22` : `${s.color}18`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <s.Icon sx={{ color: s.color, fontSize: 24 }} />
                </Box>
              )}
              <Box>
                {loading ? (
                  <>
                    <Skeleton width={60} height={36} />
                    <Skeleton width={50} height={16} />
                  </>
                ) : (
                  <>
                    <Typography sx={{
                      fontFamily: '"Nunito", sans-serif',
                      fontWeight: 900,
                      fontSize: '2rem',
                      color: s.color,
                      lineHeight: 1,
                    }}>
                      {s.value}
                    </Typography>
                    <Typography sx={{
                      fontSize: '0.72rem',
                      color: dark ? '#94a3b8' : '#6b7280',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      mt: 0.2,
                    }}>
                      {s.label}
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Filter bar ── */}
      <Card sx={{ ...cardSx(dark), mb: 2.5 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterAltIcon fontSize="small" sx={{ color: dark ? '#38c586' : '#2d5016' }} />
                <Typography sx={{ fontWeight: 700, color: dark ? '#38c586' : '#2d5016', fontSize: '0.88rem' }}>
                  Filters
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                type="date" label="Date" fullWidth size="small"
                value={filterDate}
                onChange={e => { const val = e.target.value; setFilterDate(val); load(val || undefined); }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField select label="Status" fullWidth size="small" value={filterSt} onChange={e => setFilterSt(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                placeholder="Search student name…" fullWidth size="small"
                value={search} onChange={e => setSearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: dark ? '#64748b' : '#9ca3af' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Button
                variant="outlined" size="small" startIcon={<ClearIcon />}
                onClick={() => {
                  const today = getLocalDateStr();
                  setFilterDate(today);
                  setFilterSt('');
                  setSearch('');
                  load(today);          // ← Clear resets back to today, not all-time
                }}
                sx={{
                  borderColor: dark ? '#334155' : '#d1d5db',
                  color: dark ? '#94a3b8' : '#6b7280',
                  '&:hover': {
                    borderColor: dark ? '#38c586' : '#2d5016',
                    color: dark ? '#38c586' : '#2d5016',
                    background: dark ? 'rgba(56,197,134,0.06)' : '#f0f7e8',
                  },
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card sx={{ ...cardSx(dark) }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ overflowX: 'auto' }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} height={50} sx={{ mb: 0.5, borderRadius: 1 }} />
                ))}
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    {/* ── 8 columns now (added Time) ── */}
                    {['Student Name', 'LRN', 'Gender', 'Date', 'Time', 'Session', 'Status', 'Actions'].map(h => (
                      <TableCell key={h}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      {/* colSpan updated from 7 → 8 */}
                      <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                        <ChecklistIcon sx={{
                          fontSize: 50,
                          color: dark ? 'rgba(56,197,134,0.2)' : 'rgba(0,0,0,0.1)',
                          display: 'block', mx: 'auto', mb: 1,
                        }} />
                        <Typography sx={{ color: dark ? '#64748b' : '#9ca3af', fontWeight: 600 }}>
                          No records found
                        </Typography>
                        <Typography sx={{ color: dark ? '#475569' : '#d1d5db', fontSize: '0.8rem', mt: 0.5 }}>
                          {filterDate
                            ? `No attendance records for ${filterDate}`
                            : 'Adjust filters or add a new record'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : displayed.map(r => (
                    <TableRow key={r.id}>

                      {/* Student Name */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <StudentAvatar
                            studentName={r.student_name}
                            dark={dark}
                            photoCache={photoCache}
                            onPhotoClick={(name, url) => setPhotoDialog({ name, url })}
                          />
                          <Typography sx={{ fontWeight: 600, fontSize: '0.87rem' }}>
                            {r.student_name}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* LRN */}
                      <TableCell sx={{ fontSize: '0.8rem', fontFamily: 'monospace', color: dark ? '#64748b' : '#9ca3af' }}>
                        {r.lrn || '—'}
                      </TableCell>

                      {/* Gender */}
                      <TableCell sx={{ fontSize: '0.85rem' }}>
                        {r.gender === 'M' ? 'Male' : r.gender === 'F' ? 'Female' : '—'}
                      </TableCell>

                      {/* Date */}
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {r.date}
                      </TableCell>

                      {/* ── Timestamp (NEW) ──────────────────────────────────────────
                          Tries r.time_in first (dedicated scan field), then falls back
                          to r.created_at (record creation time). Shows "—" if neither
                          field exists on the record.                                  */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <AccessTimeIcon
                            sx={{
                              fontSize: 13,
                              color: dark ? '#64748b' : '#9ca3af',
                              flexShrink: 0,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: (r.time_in || r.created_at)
                                ? (dark ? '#e2e8f0' : '#374151')
                                : (dark ? '#475569' : '#d1d5db'),
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {fmtTime(r.timestamp ?? r.time_in ?? r.created_at)}
                          </Typography>
                        </Box>
                      </TableCell>

                      {/* Session */}
                      <TableCell>
                        <Chip
                          label={r.session}
                          size="small"
                          sx={{
                            bgcolor: dark ? 'rgba(56,197,134,0.12)' : 'rgba(45,80,22,0.08)',
                            color: dark ? '#38c586' : '#2d5016',
                            fontWeight: 700, fontSize: '0.7rem',
                            border: `1px solid ${dark ? 'rgba(56,197,134,0.25)' : 'rgba(45,80,22,0.2)'}`,
                          }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={canonicalStatus(r.status)}
                          color={chipColor(r.status)}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit record">
                            <IconButton size="small" onClick={() => openEdit(r)} sx={iconBtnSx('#f59e0b', 'rgba(245,158,11,0.1)')}>
                              <EditIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>

                          {r.qr_data ? (
                            <Tooltip title="View & Download QR Code">
                              <IconButton
                                size="small"
                                onClick={() => openQrDialog(r)}
                                sx={iconBtnSx('#6366f1', 'rgba(99,102,241,0.1)')}
                              >
                                <QrCode2Icon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="No QR data for this record">
                              <span>
                                <IconButton size="small" disabled sx={{ opacity: 0.3 }}>
                                  <QrCode2Icon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          <Tooltip title="Delete record">
                            <IconButton size="small" onClick={() => setDeleteId(r.id)} sx={iconBtnSx('#e63946', 'rgba(230,57,70,0.1)')}>
                              <DeleteIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>

          {!loading && displayed.length > 0 && (
            <Box sx={{ px: 3, py: 1.5, borderTop: `1px solid ${dark ? '#334155' : '#f0f0f0'}` }}>
              <Typography sx={{ fontSize: '0.78rem', color: dark ? '#64748b' : '#9ca3af' }}>
                Showing {displayed.length} of {rows.length} record{rows.length !== 1 ? 's' : ''}
                {filterDate ? ` for ${filterDate}` : ''}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ════════════════════════════════════════════════
          SF2 / Export Section
      ════════════════════════════════════════════════ */}
      <Card sx={{ ...cardSx(dark), mt: 3 }}>
        <CardContent sx={{ p: 3 }}>

          {/* Section header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <TableChartIcon sx={{ color: dark ? '#4ade80' : '#2d5016', fontSize: 26 }} />
            <Box>
              <Typography sx={{
                fontFamily: '"Nunito", sans-serif',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: dark ? '#4ade80' : '#2d5016',
              }}>
                Export Attendance Data
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: dark ? '#64748b' : '#9ca3af', mt: 0.3 }}>
                Export filtered records to CSV or generate a DepEd SF2 Excel report
              </Typography>
            </Box>
          </Box>

          {/* ── CSV Export block ── */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: dark ? 'rgba(59,130,246,0.07)' : '#eff6ff',
              border: `1px solid ${dark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
              mb: 3,
            }}
          >
            <Typography sx={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: dark ? '#93c5fd' : '#1d4ed8',
              mb: 1.5,
              display: 'flex', alignItems: 'center', gap: 0.75,
            }}>
              <FileDownloadIcon sx={{ fontSize: 18 }} />
              CSV Export
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <TextField
                select
                label="Filter by Status"
                size="small"
                value={csvStatusFilter}
                onChange={e => setCsvStatusFilter(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                {csvStatusOptions.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>

              <Button
                variant="contained"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCSV}
                sx={{
                  px: 3,
                  background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  '&:hover': { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
                  borderRadius: '10px',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                }}
              >
                Export to CSV
              </Button>
            </Box>

            {csvMsg && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon fontSize="small" />}
                onClose={() => setCsvMsg('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5 }}
              >
                {csvMsg}
              </Alert>
            )}
            {csvErr && (
              <Alert severity="error" onClose={() => setCsvErr('')} sx={{ mt: 1.5, borderRadius: '8px', py: 0.5 }}>
                {csvErr}
              </Alert>
            )}
          </Box>

          <Divider sx={{ borderColor: dark ? 'rgba(255,255,255,0.06)' : '#f0f0f0', mb: 3 }} />

          {/* ── SF2 Report Generation block ── */}
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              background: dark ? 'rgba(56,197,134,0.07)' : '#f0fdf4',
              border: `1px solid ${dark ? 'rgba(56,197,134,0.2)' : '#bbf7d0'}`,
            }}
          >
            <Typography sx={{
              fontWeight: 700,
              fontSize: '0.88rem',
              color: dark ? '#4ade80' : '#15803d',
              mb: 1.5,
              display: 'flex', alignItems: 'center', gap: 0.75,
            }}>
              <InsertDriveFileIcon sx={{ fontSize: 18 }} />
              SF2 Report Generation
            </Typography>

            {/* Month / Year selectors */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                select label="Month" size="small"
                value={sf2Month}
                onChange={e => setSf2Month(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                {monthOptions.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                select label="Year" size="small"
                value={sf2Year}
                onChange={e => setSf2Year(e.target.value)}
                sx={{ minWidth: 110 }}
              >
                {yearOptions.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Upload + Generate row */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>

              {/* Hidden file input */}
              <input
                ref={sf2FileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleSf2FileChange}
                id="sf2-template-input"
              />

              {/* Upload button */}
              <Button
                component="label"
                htmlFor="sf2-template-input"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  borderColor: dark ? 'rgba(56,197,134,0.4)' : '#86efac',
                  color: dark ? '#4ade80' : '#15803d',
                  '&:hover': {
                    borderColor: dark ? '#4ade80' : '#22c55e',
                    background: dark ? 'rgba(56,197,134,0.08)' : '#dcfce7',
                  },
                }}
              >
                Upload SF2 Template
              </Button>

              {/* Chosen file chip */}
              {sf2TemplateFile && (
                <Chip
                  label={sf2TemplateFile.name}
                  size="small"
                  icon={<CheckCircleIcon style={{ color: dark ? '#4ade80' : '#15803d' }} />}
                  onDelete={() => {
                    setSf2TemplateFile(null);
                    if (sf2FileRef.current) sf2FileRef.current.value = '';
                  }}
                  sx={{
                    bgcolor: dark ? 'rgba(56,197,134,0.1)' : '#dcfce7',
                    color:   dark ? '#4ade80' : '#15803d',
                    fontWeight: 600,
                    fontSize: '0.72rem',
                    border: `1px solid ${dark ? 'rgba(56,197,134,0.3)' : '#86efac'}`,
                  }}
                />
              )}

              {/* Generate button */}
              <Button
                variant="contained"
                startIcon={
                  sf2Loading
                    ? <CircularProgress size={15} color="inherit" />
                    : <InsertDriveFileIcon />
                }
                disabled={!sf2TemplateFile || sf2Loading}
                onClick={handleGenerateSF2}
                sx={{
                  px: 3,
                  borderRadius: '10px',
                  fontWeight: 700,
                  background: dark
                    ? 'linear-gradient(135deg,#38c586,#2da86e)'
                    : 'linear-gradient(135deg,#2d5016,#4a7a25)',
                  boxShadow: dark
                    ? '0 4px 14px rgba(56,197,134,0.3)'
                    : '0 4px 14px rgba(45,80,22,0.25)',
                  '&:hover': {
                    background: dark
                      ? 'linear-gradient(135deg,#2da86e,#1e8a5a)'
                      : 'linear-gradient(135deg,#3a6420,#5a8a30)',
                  },
                  '&.Mui-disabled': { opacity: 0.55 },
                }}
              >
                {sf2Loading ? 'Generating…' : 'Generate SF2 Report'}
              </Button>
            </Box>

            {/* Info hint */}
            <Typography sx={{
              mt: 1.5,
              fontSize: '0.75rem',
              color: dark ? '#64748b' : '#6b7280',
            }}>
              Upload your DepEd SF2 template (.xlsx), select the month and year, then click Generate.
              The backend will fill the template with attendance data for that period and return a
              downloadable Excel file.
            </Typography>

            {sf2Msg && (
              <Alert
                severity="success"
                icon={<CheckCircleIcon fontSize="small" />}
                onClose={() => setSf2Msg('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5 }}
              >
                {sf2Msg}
              </Alert>
            )}
            {sf2Err && (
              <Alert severity="error" onClose={() => setSf2Err('')} sx={{ mt: 1.5, borderRadius: '8px', py: 0.5 }}>
                {sf2Err}
              </Alert>
            )}
          </Box>

        </CardContent>
      </Card>

      {/* ════ Photo Expand Dialog ════ */}
      <Dialog
        open={photoDialog !== null}
        onClose={() => setPhotoDialog(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            background: dark ? '#0f172a' : '#ffffff',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          fontWeight: 700,
          fontSize: '1rem',
          color: dark ? '#e2e8f0' : '#1e293b',
        }}>
          {photoDialog?.name}
          <IconButton size="small" onClick={() => setPhotoDialog(null)} sx={{ color: dark ? '#64748b' : '#9ca3af' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {photoDialog && (
            <Box
              component="img"
              src={photoDialog.url}
              alt={photoDialog.name}
              sx={{
                width: '100%',
                maxHeight: '70vh',
                objectFit: 'contain',
                display: 'block',
                background: dark ? '#1e293b' : '#f8fafc',
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ════ QR Code Dialog ════ */}
      <Dialog
        open={qrDialog !== null}
        onClose={() => setQrDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '18px',
            background: dark ? '#0f172a' : '#ffffff',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: '1rem',
          color: dark ? '#e2e8f0' : '#1e293b',
          pb: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode2Icon sx={{ color: '#6366f1', fontSize: 22 }} />
            QR Code
          </Box>
          <IconButton size="small" onClick={() => setQrDialog(null)} sx={{ color: dark ? '#64748b' : '#0f172a' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>

          <Typography sx={{
            fontWeight: 700,
            fontSize: '1rem',
            color: dark ? '#e2e8f0' : '#1e293b',
            textAlign: 'center',
          }}>
            {qrDialog?.name}
          </Typography>

          {qrDialog && (
            <Box sx={{
              p: 2,
              borderRadius: '14px',
              background: '#ffffff',
              border: `2px solid ${dark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(99,102,241,0.2)'}`,
              boxShadow: dark
                ? '0 4px 24px rgba(99,102,241,0.2)'
                : '0 4px 16px rgba(10, 10, 41, 0.12)',
              display: 'inline-block',
            }}>
              <Box
                component="img"
                src={getQrImageUrl(qrDialog.qrData, 260)}
                alt={`QR Code for ${qrDialog.name}`}
                sx={{ display: 'block', width: 260, height: 260 }}
              />
            </Box>
          )}

          {qrDialog && (
            <Box sx={{
              width: '100%',
              p: 1.5,
              borderRadius: '10px',
              background: dark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.04)',
              border: `1px solid ${dark ? 'rgba(99,102,241,0.2)' : 'rgba(6, 6, 29, 0.14)'}`,
            }}>
              <Typography sx={{
                fontSize: '0.68rem',
                fontFamily: '"Nunito", sans-serif',
                color: dark ? '#94a3b8' : '#6b7280',
                wordBreak: 'break-all',
                lineHeight: 1.6,
              }}>
                {qrDialog.qrData.length > 200
                  ? qrDialog.qrData.slice(0, 200) + '…'
                  : qrDialog.qrData}
              </Typography>
            </Box>
          )}

        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
          <Button
            onClick={() => setQrDialog(null)}
            sx={{ color: dark ? '#94a3b8' : '#0f172a' }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleQrDownload}
            disabled={qrDownloading}
            startIcon={
              qrDownloading
                ? <CircularProgress size={15} color="inherit" />
                : <DownloadIcon />
            }
            sx={{
              px: 3,
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              '&:hover': { background: 'linear-gradient(135deg,#4f46e5,#4338ca)' },
              '&.Mui-disabled': { opacity: 0.65 },
            }}
          >
            {qrDownloading ? 'Downloading…' : 'Download PNG'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Add / Edit Dialog ════ */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId !== null ? 'Edit Attendance Record' : 'Add Attendance Record'}
        </DialogTitle>
        <DialogContent sx={{ pt: '14px !important' }}>
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
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
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
          <Button onClick={() => setDialogOpen(false)} sx={{ color: dark ? '#94a3b8' : '#6b7280' }}>Cancel</Button>
          <Button
            variant="contained" onClick={save}
            disabled={saving || !form.student_name.trim()}
            startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <SaveIcon />}
            sx={{
              px: 3,
              background: dark ? 'linear-gradient(135deg,#38c586,#2da86e)' : 'linear-gradient(135deg,#2d5016,#4a7a25)',
              '&:hover': {
                background: dark ? 'linear-gradient(135deg,#2da86e,#1e8a5a)' : 'linear-gradient(135deg,#3a6420,#5a8a30)',
              },
            }}
          >
            {editId !== null ? 'Update' : 'Save Record'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ════ Delete Confirm Dialog ════ */}
      <Dialog open={deleteId !== null} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: dark ? '#94a3b8' : '#6b7280' }}>
            Are you sure you want to permanently delete this attendance record? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteId(null)} sx={{ color: dark ? '#94a3b8' : '#6b7280' }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}
            sx={{ background: 'linear-gradient(135deg,#e63946,#c62828)', '&:hover': { background: '#b91c1c' } }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}