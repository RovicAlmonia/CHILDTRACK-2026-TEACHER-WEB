import { useState, useMemo, useRef } from 'react';
import {
  Box, Typography, Chip, Card, CardContent, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, InputAdornment,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Avatar, Button, Divider, Alert, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon           from '@mui/icons-material/Search';
import FileDownloadIcon     from '@mui/icons-material/FileDownload';
import PeopleIcon           from '@mui/icons-material/People';
import TableChartIcon       from '@mui/icons-material/TableChart';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import InsertDriveFileIcon  from '@mui/icons-material/InsertDriveFile';
import UploadFileIcon       from '@mui/icons-material/UploadFile';

import { useApi }                  from '../hooks/useApi';
import { StatusBadge, LoadingOverlay, ErrorCard } from '../components/SharedComponents';
import TeacherAttendanceModal      from '../dialogs/TeacherAttendanceModal';
import { EMERALD, fmtDate, initials } from '../constants';

/* ─────────────────────────────────────────────────────────────────── */
const BACKEND_URL = import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

const API_BASE = `${BACKEND_URL}/api`;

// ─────────────────────────────────────────────────────────────
// SheetJS dynamic loader
// ─────────────────────────────────────────────────────────────
let _XLSX = null;
async function getXLSX() {
  if (_XLSX) return _XLSX;
  _XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  return _XLSX;
}

// ─────────────────────────────────────────────────────────────
// Excel helpers
// ─────────────────────────────────────────────────────────────

/** Sanitise a sheet name: max 31 chars, no invalid chars */
function safeSheetName(name, index) {
  const cleaned = (name ?? `Sheet${index + 1}`)
    .replace(/[:\\\/\?\*\[\]]/g, '')
    .trim()
    .slice(0, 31);
  return cleaned || `Sheet${index + 1}`;
}

/**
 * Build a single .xlsx workbook with one sheet per teacher and trigger download.
 * @param {Array<{sheetName: string, headers: string[], rows: Array<string[]>}>} sheets
 * @param {string} filename
 */
async function downloadExcel(sheets, filename) {
  const XLSX = await getXLSX();

  const wb = XLSX.utils.book_new();

  // Track used sheet names to avoid duplicates
  const usedNames = new Set();

  sheets.forEach((sheet, idx) => {
    let name = safeSheetName(sheet.sheetName, idx);
    // Deduplicate
    if (usedNames.has(name)) {
      const suffix = `_${idx + 1}`;
      name = name.slice(0, 31 - suffix.length) + suffix;
    }
    usedNames.add(name);

    const wsData = [sheet.headers, ...sheet.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-width columns
    const colWidths = sheet.headers.map((h, ci) => {
      const maxLen = Math.max(
        h.length,
        ...sheet.rows.map(r => String(r[ci] ?? '').length),
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 60) };
    });
    ws['!cols'] = colWidths;

    // Freeze first row (header)
    ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };

    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  XLSX.writeFile(wb, filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────
// AttendancePage (Principal)
// ─────────────────────────────────────────────────────────────
export default function AttendancePage({ teachers }) {
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [filterDate,    setFilterDate]    = useState('');
  const [teacherModal,  setTeacherModal]  = useState(null);

  // ── Students export state ──
  const [exportMsg,     setExportMsg]     = useState('');
  const [exportErr,     setExportErr]     = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // ── Monthly Excel export state ──
  const [attExportMsg, setAttExportMsg] = useState('');
  const [attExportErr, setAttExportErr] = useState('');
  const [attMonth,     setAttMonth]     = useState(String(new Date().getMonth() + 1));
  const [attYear,      setAttYear]      = useState(String(new Date().getFullYear()));
  const [attLoading,   setAttLoading]   = useState(false);

  // ── SF2 state ──
  const [sf2TemplateFile, setSf2TemplateFile] = useState(null);
  const [sf2Month,        setSf2Month]        = useState(String(new Date().getMonth() + 1));
  const [sf2Year,         setSf2Year]         = useState(String(new Date().getFullYear()));
  const [sf2Loading,      setSf2Loading]      = useState(false);
  const [sf2Msg,          setSf2Msg]          = useState('');
  const [sf2Err,          setSf2Err]          = useState('');
  const sf2FileRef = useRef(null);

  const queryStr = useMemo(() => {
    const p = new URLSearchParams();
    if (filterStatus  !== 'All') p.set('status',  filterStatus);
    if (filterSection !== 'All') p.set('section', filterSection);
    if (filterDate)               p.set('date',    filterDate);
    if (search)                   p.set('search',  search);
    const s = p.toString();
    return s ? `?${s}` : '';
  }, [filterStatus, filterSection, filterDate, search]);

  const { data: attendance, loading, error, refetch } = useApi(`/attendance${queryStr}`, [queryStr], 30_000);
  const { data: allStudents   } = useApi('/students',   [], 60_000);
  const { data: allAttendance } = useApi('/attendance',  [], 60_000);
  const { data: allGuardians  } = useApi('/guardians',   [], 60_000);

  const { data: teacherAtt } = useApi(
    teacherModal ? `/attendance?teacher_id=${teacherModal.id}` : null,
    [teacherModal?.id],
    30_000,
  );

  const sections    = ['All', ...Array.from(new Set((teachers ?? []).map(t => t.section)))];
  const statuses    = ['All', 'Present', 'Absent', 'Late', 'Drop-off', 'Pick-up'];
  const teacherById = useMemo(
    () => Object.fromEntries((teachers ?? []).map(t => [t.id, t])),
    [teachers],
  );

  const monthOptions = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ].map((m, i) => ({ value: String(i + 1), label: m }));

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1]
    .map(y => ({ value: String(y), label: String(y) }));

  // ── Guardian lookup: student_id → guardian[] ──
  const guardiansByStudentId = useMemo(() => {
    const map = {};
    (allGuardians ?? []).forEach(g => {
      if (!map[g.student_id]) map[g.student_id] = [];
      map[g.student_id].push(g);
    });
    return map;
  }, [allGuardians]);

  // ─────────────────────────────────────────────────────────────
  // Export: All Students — single Excel, one sheet per teacher
  // ─────────────────────────────────────────────────────────────
  const handleExportStudents = async () => {
    setExportErr('');
    setExportMsg('');
    setExportLoading(true);

    try {
      const students = allStudents ?? [];
      if (!students.length) {
        setExportErr('No student data available yet. Wait for the data to load.');
        return;
      }

      const teacherMap = Object.fromEntries((teachers ?? []).map(t => [t.id, t]));

      const headers = [
        'Student ID', 'LRN', 'Name', 'Gender',
        'Section', 'Teacher', 'Teacher Contact', 'Enrolled Date',
        'Guardian 1 Role', 'Guardian 1 Name', 'Guardian 1 Contact',
        'Guardian 2 Role', 'Guardian 2 Name', 'Guardian 2 Contact',
        'Guardian 3 Role', 'Guardian 3 Name', 'Guardian 3 Contact',
      ];

      // Group students by teacher
      const byTeacher = {};
      students.forEach(s => {
        const key = String(s.teacher_id ?? 'unassigned');
        if (!byTeacher[key]) byTeacher[key] = [];
        byTeacher[key].push(s);
      });

      const sheets = [];

      Object.entries(byTeacher).forEach(([teacherIdStr, teacherStudents]) => {
        const t           = teacherMap[teacherIdStr] ?? {};
        const teacherName = t.name    ?? `Teacher_${teacherIdStr}`;
        const section     = t.section ?? teacherIdStr;

        const sorted = [...teacherStudents].sort((a, b) =>
          String(a.name ?? '').localeCompare(String(b.name ?? '')),
        );

        const rows = sorted.map(s => {
          const guards = guardiansByStudentId[s.id] ?? [];
          const g1 = guards[0] ?? {};
          const g2 = guards[1] ?? {};
          const g3 = guards[2] ?? {};

          return [
            String(s.id ?? ''),
            s.lrn  ?? '',
            s.name ?? '',
            s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : '',
            t.section ?? s.section      ?? '',
            t.name    ?? s.teacher_name ?? '',
            t.contact ?? '',
            s.created_at ? s.created_at.slice(0, 10) : '',
            g1.role ?? '', g1.name ?? '', g1.contact_number ?? '',
            g2.role ?? '', g2.name ?? '', g2.contact_number ?? '',
            g3.role ?? '', g3.name ?? '', g3.contact_number ?? '',
          ];
        });

        // Sheet name: "Section - Teacher" (truncated to 31 chars)
        const sheetName = `${section} - ${teacherName}`;
        sheets.push({ sheetName, headers, rows });
      });

      if (!sheets.length) { setExportErr('No student data to export.'); return; }

      const date     = new Date().toISOString().slice(0, 10);
      const filename = `Students_MasterList_${date}.xlsx`;
      await downloadExcel(sheets, filename);

      setExportMsg(
        `${students.length} student(s) exported into ${sheets.length} sheet(s) — one sheet per teacher — in a single Excel file.`,
      );
    } catch (e) {
      setExportErr(e.message ?? 'Export failed.');
    } finally {
      setExportLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Export: Monthly Attendance Summary — single Excel, one sheet per teacher
  // ─────────────────────────────────────────────────────────────
  const handleExportMonthlySummary = async () => {
    setAttExportErr('');
    setAttExportMsg('');
    setAttLoading(true);

    try {
      const att      = allAttendance ?? [];
      const students = allStudents   ?? [];

      if (!students.length) {
        setAttExportErr('No student data available yet.');
        return;
      }

      const targetMonth = parseInt(attMonth);
      const targetYear  = parseInt(attYear);

      const monthAtt = att.filter(r => {
        if (!r.date) return false;
        const d = new Date(r.date + 'T00:00:00');
        return d.getFullYear() === targetYear && (d.getMonth() + 1) === targetMonth;
      });

      const teacherMap = Object.fromEntries((teachers ?? []).map(t => [t.id, t]));
      const norm = s => (s ?? '').toLowerCase().replace(/[-_\s]/g, '');

      const headers = [
        'LRN', 'Student Name', 'Gender', 'Section', 'Teacher',
        'Guardian 1 Role', 'Guardian 1 Name', 'Guardian 1 Contact',
        'Guardian 2 Role', 'Guardian 2 Name', 'Guardian 2 Contact',
        'Guardian 3 Role', 'Guardian 3 Name', 'Guardian 3 Contact',
        'Days Present', 'Days Absent', 'Days Late', 'Drop-off Count', 'Pick-up Count',
        'Total Records', 'Attendance Rate (%)',
      ];

      // Group students by teacher
      const byTeacher = {};
      students.forEach(s => {
        const key = String(s.teacher_id ?? 'unassigned');
        if (!byTeacher[key]) byTeacher[key] = [];
        byTeacher[key].push(s);
      });

      const sheets = [];
      let totalStudentCount = 0;

      Object.entries(byTeacher).forEach(([teacherIdStr, teacherStudents]) => {
        const t           = teacherMap[teacherIdStr] ?? {};
        const teacherName = t.name    ?? `Teacher_${teacherIdStr}`;
        const section     = t.section ?? teacherIdStr;

        const sorted = [...teacherStudents].sort((a, b) =>
          String(a.name ?? '').localeCompare(String(b.name ?? '')),
        );

        const rows = sorted.map(s => {
          const studentAtt = monthAtt.filter(r =>
            r.teacher_id === s.teacher_id &&
            (r.student_name === s.name || r.lrn === s.lrn),
          );

          const present = studentAtt.filter(r => norm(r.status) === 'present').length;
          const absent  = studentAtt.filter(r => norm(r.status) === 'absent').length;
          const late    = studentAtt.filter(r => norm(r.status) === 'late').length;
          const dropoff = studentAtt.filter(r => norm(r.status) === 'dropoff').length;
          const pickup  = studentAtt.filter(r => norm(r.status) === 'pickup').length;
          const total   = studentAtt.length;
          const rate    = total > 0 ? Math.round((present / total) * 100) : 0;

          const guards = guardiansByStudentId[s.id] ?? [];
          const g1 = guards[0] ?? {};
          const g2 = guards[1] ?? {};
          const g3 = guards[2] ?? {};

          return [
            s.lrn ?? '', s.name ?? '',
            s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : '',
            section,
            t.name ?? s.teacher_name ?? '',
            g1.role ?? '', g1.name ?? '', g1.contact_number ?? '',
            g2.role ?? '', g2.name ?? '', g2.contact_number ?? '',
            g3.role ?? '', g3.name ?? '', g3.contact_number ?? '',
            present, absent, late, dropoff, pickup,   // numbers, not strings
            total, `${rate}%`,
          ];
        });

        // Sheet name: "Section - Teacher"
        const sheetName = `${section} - ${teacherName}`;
        sheets.push({ sheetName, headers, rows });
        totalStudentCount += rows.length;
      });

      if (!sheets.length) { setAttExportErr('No data to export.'); return; }

      const monthLabel = monthOptions.find(m => m.value === attMonth)?.label ?? attMonth;
      const filename   = `Attendance_${monthLabel}_${attYear}.xlsx`;
      await downloadExcel(sheets, filename);

      setAttExportMsg(
        `Monthly summary for ${monthLabel} ${attYear} exported — ${totalStudentCount} student(s) across ${sheets.length} sheet(s) in one Excel file.`,
      );
    } catch (e) {
      setAttExportErr(e.message ?? 'Export failed.');
    } finally {
      setAttLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SF2 generation (server-side, unchanged)
  // ─────────────────────────────────────────────────────────────
  const handleSf2FileChange = e => {
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
      const headers = {};
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
    } catch (err) {
      setSf2Err(err.message ?? 'Failed to generate SF2 report.');
    } finally {
      setSf2Loading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'text.primary' }}>
          Attendance Records
        </Typography>
        <Chip label={`${attendance?.length ?? 0} records`} size="small" sx={{ fontWeight: 700 }} />
      </Box>

      {/* View by Teacher chips */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
          View by Teacher
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {(teachers ?? []).map(t => (
            <Chip key={t.id}
              avatar={
                <Avatar sx={{ bgcolor: `${alpha(EMERALD, 0.2)} !important`, color: `${EMERALD} !important`, fontSize: '0.6rem !important', fontWeight: 800 }}>
                  {initials(t.name)}
                </Avatar>
              }
              label={`${t.name} · ${t.section}`}
              onClick={() => setTeacherModal(t)}
              sx={{ fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                '&:hover': { bgcolor: th => alpha(EMERALD, th.palette.mode === 'dark' ? 0.15 : 0.1) } }}
            />
          ))}
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ borderRadius: '14px', mb: 2 }}>
        <CardContent sx={{ p: '14px 16px !important' }}>
          <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField size="small" fullWidth placeholder="Search student or LRN…"
                value={search} onChange={e => setSearch(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Section</InputLabel>
                <Select value={filterSection} label="Section" onChange={e => setFilterSection(e.target.value)} sx={{ borderRadius: '10px' }}>
                  {sections.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)} sx={{ borderRadius: '10px' }}>
                  {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField type="date" size="small" fullWidth value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }} label="Date"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      {loading ? <LoadingOverlay /> : error ? <ErrorCard message={error} onRetry={refetch} /> : (
        <Card sx={{ borderRadius: '14px' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' } }}>
                  <TableCell>Student</TableCell>
                  <TableCell>LRN</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Session</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!attendance?.length ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No records found
                    </TableCell>
                  </TableRow>
                ) : attendance.map(r => {
                  const teacher = teacherById[r.teacher_id];
                  return (
                    <TableRow key={r.id} hover sx={{ '&:last-child td': { border: 0 }, cursor: 'pointer' }}
                      onClick={() => teacher && setTeacherModal(teacher)}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.83rem' }}>{r.student_name}</TableCell>
                      <TableCell sx={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.78rem', color: 'text.secondary' }}>{r.lrn}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{r.section ?? teacher?.section ?? '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: EMERALD, fontWeight: 600 }}>{r.teacher_name ?? teacher?.name ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>
                        <Chip label={r.session} size="small"
                          sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20,
                            bgcolor: r.session === 'AM' ? alpha('#f59e0b', 0.12) : alpha('#6366f1', 0.12),
                            color: r.session === 'AM' ? '#f59e0b' : '#6366f1' }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{fmtDate(r.date)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════
          BATCH EXPORT SECTION
      ════════════════════════════════════════════════════════════ */}
      <Card sx={{ borderRadius: '16px', mt: 3 }}>
        <CardContent sx={{ p: 3 }}>

          {/* Section header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <TableChartIcon sx={{ color: EMERALD, fontSize: 24 }} />
            <Box>
              <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.15rem', color: 'text.primary' }}>
                Batch Export
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.2 }}>
                Download school-wide reports as a single Excel file — one sheet per teacher
              </Typography>
            </Box>
          </Box>

          {/* ── Block 1: All Students ── */}
          <Box sx={{
            p: 2.5, borderRadius: '12px', mb: 3,
            bgcolor: t => t.palette.mode === 'dark' ? alpha(EMERALD, 0.06) : alpha(EMERALD, 0.04),
            border:  t => `1px solid ${t.palette.mode === 'dark' ? alpha(EMERALD, 0.18) : alpha(EMERALD, 0.15)}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
                  <PeopleIcon sx={{ fontSize: 17, color: EMERALD }} />
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: EMERALD }}>
                    All Students — Master List (one sheet per teacher)
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 460, lineHeight: 1.6 }}>
                  Exports a single <strong>.xlsx</strong> file. Each sheet is named after the teacher's
                  section and contains every enrolled student's LRN, gender, section,
                  and up to 3 guardians (role, name, contact). Sorted alphabetically within each sheet.
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.8, mt: 1, flexWrap: 'wrap' }}>
                  {['LRN', 'Name', 'Gender', 'Section', 'Teacher', 'G1 Role/Name/Contact', 'G2 Role/Name/Contact', 'G3 Role/Name/Contact'].map(col => (
                    <Chip key={col} label={col} size="small" sx={{
                      height: 18, fontSize: '0.6rem', fontWeight: 700,
                      bgcolor: t => t.palette.mode === 'dark' ? alpha(EMERALD, 0.1) : alpha(EMERALD, 0.08),
                      color: EMERALD,
                    }} />
                  ))}
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={exportLoading ? <CircularProgress size={15} color="inherit" /> : <FileDownloadIcon />}
                disabled={exportLoading}
                onClick={handleExportStudents}
                sx={{
                  borderRadius: '10px', fontWeight: 700, px: 2.5, flexShrink: 0,
                  bgcolor: EMERALD,
                  '&:hover': { bgcolor: '#2eac72' },
                  boxShadow: `0 4px 14px ${alpha(EMERALD, 0.35)}`,
                  '&.Mui-disabled': { opacity: 0.55 },
                }}
              >
                {exportLoading ? 'Generating…' : 'Export Students (.xlsx)'}
              </Button>
            </Box>
            {exportMsg && (
              <Alert severity="success" icon={<CheckCircleIcon fontSize="small" />}
                onClose={() => setExportMsg('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5, fontSize: '0.8rem' }}>
                {exportMsg}
              </Alert>
            )}
            {exportErr && (
              <Alert severity="error" onClose={() => setExportErr('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5, fontSize: '0.8rem' }}>
                {exportErr}
              </Alert>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* ── Block 2: Monthly Attendance Summary Excel ── */}
          <Box sx={{
            p: 2.5, borderRadius: '12px', mb: 3,
            bgcolor: t => t.palette.mode === 'dark' ? alpha('#3b82f6', 0.06) : '#eff6ff',
            border:  t => `1px solid ${t.palette.mode === 'dark' ? alpha('#3b82f6', 0.2) : '#bfdbfe'}`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
              <TableChartIcon sx={{ fontSize: 17, color: '#3b82f6' }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#3b82f6' }}>
                Monthly Attendance Summary (one sheet per teacher)
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 480, lineHeight: 1.6, mb: 1.5 }}>
              Generates a single <strong>.xlsx</strong> file. Each teacher gets their own sheet
              containing every student's attendance totals (present, absent, late, drop-off, pick-up)
              and attendance rate for the selected month, plus guardian details.
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.8, mb: 2, flexWrap: 'wrap' }}>
              {['LRN', 'Name', 'Section', 'Teacher', 'Guardians', 'Present', 'Absent', 'Late', 'Drop-off', 'Pick-up', 'Rate %'].map(col => (
                <Chip key={col} label={col} size="small" sx={{
                  height: 18, fontSize: '0.6rem', fontWeight: 700,
                  bgcolor: t => t.palette.mode === 'dark' ? alpha('#3b82f6', 0.1) : alpha('#3b82f6', 0.08),
                  color: '#3b82f6',
                }} />
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <TextField select label="Month" size="small" value={attMonth}
                onChange={e => setAttMonth(e.target.value)} sx={{ minWidth: 140 }}>
                {monthOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField select label="Year" size="small" value={attYear}
                onChange={e => setAttYear(e.target.value)} sx={{ minWidth: 100 }}>
                {yearOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <Button
                variant="contained"
                startIcon={attLoading ? <CircularProgress size={15} color="inherit" /> : <FileDownloadIcon />}
                disabled={attLoading}
                onClick={handleExportMonthlySummary}
                sx={{
                  borderRadius: '10px', fontWeight: 700, px: 2.5,
                  background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
                  '&:hover': { background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' },
                  boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
                  '&.Mui-disabled': { opacity: 0.55 },
                }}
              >
                {attLoading ? 'Generating…' : 'Export Monthly Summary (.xlsx)'}
              </Button>
            </Box>

            {attExportMsg && (
              <Alert severity="success" icon={<CheckCircleIcon fontSize="small" />}
                onClose={() => setAttExportMsg('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5, fontSize: '0.8rem' }}>
                {attExportMsg}
              </Alert>
            )}
            {attExportErr && (
              <Alert severity="error" onClose={() => setAttExportErr('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5, fontSize: '0.8rem' }}>
                {attExportErr}
              </Alert>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* ── Block 3: SF2 Report Generation ── */}
          <Box sx={{
            p: 2.5, borderRadius: '12px',
            bgcolor: t => t.palette.mode === 'dark' ? 'rgba(56,197,134,0.07)' : '#f0fdf4',
            border:  t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(56,197,134,0.2)' : '#bbf7d0'}`,
          }}>
            <Typography sx={{
              fontWeight: 700, fontSize: '0.88rem',
              color: t => t.palette.mode === 'dark' ? '#4ade80' : '#15803d',
              mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75,
            }}>
              <InsertDriveFileIcon sx={{ fontSize: 18 }} />
              SF2 Report Generation
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <TextField select label="Month" size="small" value={sf2Month}
                onChange={e => setSf2Month(e.target.value)} sx={{ minWidth: 140 }}>
                {monthOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
              <TextField select label="Year" size="small" value={sf2Year}
                onChange={e => setSf2Year(e.target.value)} sx={{ minWidth: 110 }}>
                {yearOptions.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </TextField>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                ref={sf2FileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleSf2FileChange}
                id="sf2-template-input-principal"
              />
              <Button
                component="label"
                htmlFor="sf2-template-input-principal"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderRadius: '10px', fontWeight: 600,
                  borderColor: t => t.palette.mode === 'dark' ? 'rgba(56,197,134,0.4)' : '#86efac',
                  color:       t => t.palette.mode === 'dark' ? '#4ade80' : '#15803d',
                  '&:hover': {
                    borderColor: t => t.palette.mode === 'dark' ? '#4ade80' : '#22c55e',
                    background:  t => t.palette.mode === 'dark' ? 'rgba(56,197,134,0.08)' : '#dcfce7',
                  },
                }}
              >
                Upload SF2 Template
              </Button>

              {sf2TemplateFile && (
                <Chip
                  label={sf2TemplateFile.name}
                  size="small"
                  icon={<CheckCircleIcon sx={{ color: t => t.palette.mode === 'dark' ? '#4ade80' : '#15803d' }} />}
                  onDelete={() => { setSf2TemplateFile(null); if (sf2FileRef.current) sf2FileRef.current.value = ''; }}
                  sx={{
                    bgcolor: t => t.palette.mode === 'dark' ? 'rgba(56,197,134,0.1)' : '#dcfce7',
                    color:   t => t.palette.mode === 'dark' ? '#4ade80' : '#15803d',
                    fontWeight: 600, fontSize: '0.72rem',
                    border: t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(56,197,134,0.3)' : '#86efac'}`,
                  }}
                />
              )}

              <Button
                variant="contained"
                startIcon={sf2Loading ? <CircularProgress size={15} color="inherit" /> : <InsertDriveFileIcon />}
                disabled={!sf2TemplateFile || sf2Loading}
                onClick={handleGenerateSF2}
                sx={{
                  px: 3, borderRadius: '10px', fontWeight: 700,
                  background: t => t.palette.mode === 'dark'
                    ? 'linear-gradient(135deg,#38c586,#2da86e)'
                    : 'linear-gradient(135deg,#2d5016,#4a7a25)',
                  boxShadow: t => t.palette.mode === 'dark'
                    ? '0 4px 14px rgba(56,197,134,0.3)'
                    : '0 4px 14px rgba(45,80,22,0.25)',
                  '&:hover': {
                    background: t => t.palette.mode === 'dark'
                      ? 'linear-gradient(135deg,#2da86e,#1e8a5a)'
                      : 'linear-gradient(135deg,#3a6420,#5a8a30)',
                  },
                  '&.Mui-disabled': { opacity: 0.55 },
                }}
              >
                {sf2Loading ? 'Generating…' : 'Generate SF2 Report'}
              </Button>
            </Box>

            <Typography sx={{ mt: 1.5, fontSize: '0.75rem', color: 'text.secondary' }}>
              Upload your DepEd SF2 template (.xlsx), select the month and year, then click Generate.
              The report will contain one tab per teacher, filled with that teacher's attendance data.
            </Typography>

            {sf2Msg && (
              <Alert severity="success" icon={<CheckCircleIcon fontSize="small" />}
                onClose={() => setSf2Msg('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5, fontSize: '0.8rem' }}>
                {sf2Msg}
              </Alert>
            )}
            {sf2Err && (
              <Alert severity="error" onClose={() => setSf2Err('')}
                sx={{ mt: 1.5, borderRadius: '8px', py: 0.5, fontSize: '0.8rem' }}>
                {sf2Err}
              </Alert>
            )}
          </Box>

        </CardContent>
      </Card>

      <TeacherAttendanceModal
        open={!!teacherModal}
        onClose={() => setTeacherModal(null)}
        teacher={teacherModal}
        allAttendance={teacherAtt ?? []}
      />
    </Box>
  );
}