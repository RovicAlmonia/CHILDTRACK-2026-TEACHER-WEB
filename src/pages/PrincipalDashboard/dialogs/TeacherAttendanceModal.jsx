import { useState, useEffect, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  Chip, Avatar, Divider, Grid, TextField, FormControl, InputLabel,
  Select, MenuItem, InputAdornment, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon  from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import PhoneIcon  from '@mui/icons-material/Phone';
import HomeIcon   from '@mui/icons-material/Home';
import WcIcon     from '@mui/icons-material/Wc';

import { EMERALD, norm, isPresent, isAbsent, isLate, isDropOff, isPickUp, fmtDate, initials } from '../constants';
import { StatusBadge } from '../components/SharedComponents';

/**
 * TeacherAttendanceModal
 * Props:
 *   open, onClose, teacher, allAttendance
 */
export default function TeacherAttendanceModal({ open, onClose, teacher, allAttendance }) {
  const [search,       setSearch]       = useState('');
  const [filterDate,   setFilterDate]   = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    if (open) { setSearch(''); setFilterDate(''); setFilterStatus('All'); }
  }, [open]);

  // ✅ All hooks moved above the early return to satisfy Rules of Hooks
  const teacherAtt = useMemo(() =>
    (allAttendance ?? []).filter(a => a.teacher_id === teacher?.id),
    [allAttendance, teacher?.id]
  );

  const filtered = useMemo(() => teacherAtt.filter(r => {
    if (filterStatus !== 'All' && !norm(r.status).includes(norm(filterStatus))) return false;
    if (filterDate && r.date !== filterDate) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.student_name?.toLowerCase().includes(q) && !r.lrn?.includes(q)) return false;
    }
    return true;
  }), [teacherAtt, filterStatus, filterDate, search]);

  const summary = useMemo(() => ({
    present: teacherAtt.filter(r => isPresent(r.status)).length,
    absent:  teacherAtt.filter(r => isAbsent(r.status)).length,
    late:    teacherAtt.filter(r => isLate(r.status)).length,
    dropoff: teacherAtt.filter(r => isDropOff(r.status)).length,
    pickup:  teacherAtt.filter(r => isPickUp(r.status)).length,
  }), [teacherAtt]);

  // ✅ Early return is now safe — all hooks have already been called above
  if (!teacher) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px', maxHeight: '90vh' } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: 50, height: 50,
              bgcolor: alpha(EMERALD, 0.15), color: EMERALD,
              fontWeight: 800, fontSize: '1.1rem', fontFamily: '"Nunito", sans-serif',
            }}>
              {initials(teacher.name)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>{teacher.name}</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                {teacher.section} · @{teacher.username}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* Contact info */}
        <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <PhoneIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{teacher.contact}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <HomeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{teacher.address}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <WcIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{teacher.gender}</Typography>
          </Box>
        </Box>

        {/* Summary chips */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          {[
            { label: 'Present',  val: summary.present, color: '#22c55e' },
            { label: 'Absent',   val: summary.absent,  color: '#e63946' },
            { label: 'Late',     val: summary.late,    color: '#f59e0b' },
            { label: 'Drop-off', val: summary.dropoff, color: '#3b82f6' },
            { label: 'Pick-up',  val: summary.pickup,  color: '#8b5cf6' },
          ].map(s => (
            <Chip key={s.label} size="small" label={`${s.label}: ${s.val}`}
              sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: alpha(s.color, 0.12), color: s.color }} />
          ))}
          <Chip size="small" label={`Total: ${teacherAtt.length}`}
            sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20,
              bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              color: 'text.secondary' }} />
        </Box>
      </DialogTitle>

      <Divider />

      {/* Filters */}
      <Box sx={{ px: 3, py: 1.5 }}>
        <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField size="small" fullWidth placeholder="Search student or LRN…"
              value={search} onChange={e => setSearch(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField type="date" size="small" fullWidth label="Date"
              value={filterDate} onChange={e => setFilterDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)} sx={{ borderRadius: '10px' }}>
                {['All', 'Present', 'Absent', 'Late', 'Drop-off', 'Pick-up'].map(s =>
                  <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Table */}
      <DialogContent sx={{ p: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary',
                bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' } }}>
                <TableCell>Student</TableCell>
                <TableCell>LRN</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : filtered.map(r => (
                <TableRow key={r.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.83rem' }}>{r.student_name}</TableCell>
                  <TableCell sx={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.75rem', color: 'text.secondary' }}>{r.lrn}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell>
                    <Chip label={r.session} size="small"
                      sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20,
                        bgcolor: r.session === 'AM' ? alpha('#f59e0b', 0.12) : alpha('#6366f1', 0.12),
                        color: r.session === 'AM' ? '#f59e0b' : '#6366f1' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{fmtDate(r.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}