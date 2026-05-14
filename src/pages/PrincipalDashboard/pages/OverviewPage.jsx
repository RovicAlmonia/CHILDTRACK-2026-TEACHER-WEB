import { useState } from 'react';
import {
  Box, Typography, Chip, Grid, Dialog, DialogContent,
  IconButton, Divider, Avatar, LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CalendarMonthIcon    from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon      from '@mui/icons-material/CheckCircle';
import CancelIcon           from '@mui/icons-material/Cancel';
import AccessTimeIcon       from '@mui/icons-material/AccessTime';
import DirectionsCarIcon    from '@mui/icons-material/DirectionsCar';
import EscalatorWarningIcon from '@mui/icons-material/EscalatorWarning';
import PeopleIcon           from '@mui/icons-material/People';
import SchoolIcon           from '@mui/icons-material/School';
import CloseIcon            from '@mui/icons-material/Close';
import PersonIcon           from '@mui/icons-material/Person';
import TrendingUpIcon       from '@mui/icons-material/TrendingUp';

import { useApi }        from '../hooks/useApi';
import { LoadingOverlay, ErrorCard } from '../components/SharedComponents';
import SectionDetailModal from '../dialogs/SectionDetailModal';
import { EMERALD, getLocalDateStr } from '../constants';

// ─────────────────────────────────────────────────────────────
// COMPACT STAT PILL
// ─────────────────────────────────────────────────────────────
function StatPill({ label, value, icon, color }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.2,
      px: 1.5, py: 1,
      borderRadius: '12px',
      bgcolor: t => t.palette.mode === 'dark'
        ? alpha(color, 0.08)
        : alpha(color, 0.06),
      border: t => `1px solid ${t.palette.mode === 'dark' ? alpha(color, 0.18) : alpha(color, 0.15)}`,
      minWidth: 0,
    }}>
      <Box sx={{
        width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
        bgcolor: alpha(color, 0.15),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color,
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{
          fontSize: '1.15rem', fontWeight: 800, lineHeight: 1,
          fontFamily: '"Nunito", sans-serif', color,
        }}>
          {value ?? <Box component="span" sx={{ opacity: 0.3, fontSize: '0.9rem' }}>—</Box>}
        </Typography>
        <Typography sx={{
          fontSize: '0.6rem', fontWeight: 700, color: 'text.secondary',
          textTransform: 'uppercase', letterSpacing: 0.7, lineHeight: 1.2, mt: 0.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// COMPACT SECTION ROW
// ─────────────────────────────────────────────────────────────
function SectionRow({ section, onClick }) {
  const total   = section.total   ?? 0;
  const present = section.present ?? 0;
  const absent  = section.absent  ?? 0;
  const late    = section.late    ?? 0;
  const pct     = total ? Math.round((present / total) * 100) : 0;

  const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#e63946';

  return (
    <Box onClick={onClick} sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      px: 2, py: 1.4,
      borderRadius: '12px', cursor: 'pointer',
      transition: 'all 0.15s',
      border: '1px solid transparent',
      '&:hover': {
        bgcolor: t => t.palette.mode === 'dark' ? alpha(EMERALD, 0.06) : alpha(EMERALD, 0.04),
        border: t => `1px solid ${alpha(EMERALD, 0.2)}`,
      },
    }}>
      {/* Section + teacher */}
      <Box sx={{ flex: '0 0 140px', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary', lineHeight: 1.2 }}>
          {section.section}
        </Typography>
        <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mt: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {section.teacher_name}
        </Typography>
      </Box>

      {/* Progress bar */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 600 }}>
            {present}/{total} present
          </Typography>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: barColor }}>
            {pct}%
          </Typography>
        </Box>
        <Box sx={{ height: 4, borderRadius: 99, bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }}>
          <Box sx={{ height: '100%', borderRadius: 99, width: `${pct}%`, bgcolor: barColor, transition: 'width 0.6s ease' }} />
        </Box>
      </Box>

      {/* Mini stats */}
      <Box sx={{ display: 'flex', gap: 1, flex: '0 0 auto' }}>
        {[
          { val: present, color: '#22c55e' },
          { val: absent,  color: '#e63946' },
          { val: late,    color: '#f59e0b' },
        ].map((s, i) => (
          <Typography key={i} sx={{
            fontSize: '0.75rem', fontWeight: 800,
            color: s.color, fontFamily: '"Nunito", sans-serif',
            width: 20, textAlign: 'center',
          }}>
            {s.val}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// SECTION DETAIL MODAL (compact inline version)
// ─────────────────────────────────────────────────────────────
function SectionModal({ section, allStudents, allAttendance, onClose }) {
  if (!section) return null;

  const today = getLocalDateStr();
  const sectionStudents = (allStudents ?? []).filter(s => s.teacher_id === section.teacher_id);
  const todayAtt = (allAttendance ?? []).filter(
    a => a.teacher_id === section.teacher_id && a.date === today
  );

  const getStatus = (studentName) => {
    const rec = todayAtt.find(a => a.student_name === studentName || a.lrn === studentName);
    return rec?.status ?? 'No Record';
  };

  const statusColor = (s) => {
    const n = s.toLowerCase();
    if (n === 'present') return '#22c55e';
    if (n === 'absent')  return '#e63946';
    if (n === 'late')    return '#f59e0b';
    return 'text.disabled';
  };

  const total   = section.total   ?? 0;
  const present = section.present ?? 0;
  const pct     = total ? Math.round((present / total) * 100) : 0;

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{
        sx: {
          borderRadius: '20px',
          bgcolor: t => t.palette.mode === 'dark' ? '#0d1f30' : '#fff',
          border: t => `1px solid ${t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          m: 2,
        },
      }}>
      <DialogContent sx={{ p: 0 }}>

        {/* Header */}
        <Box sx={{
          px: 3, pt: 3, pb: 2,
          borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'text.primary', fontFamily: '"Nunito", sans-serif' }}>
                {section.section}
              </Typography>
              <Chip label={`${pct}%`} size="small" sx={{
                height: 20, fontSize: '0.65rem', fontWeight: 800,
                bgcolor: alpha(EMERALD, 0.12), color: EMERALD,
              }} />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              {section.teacher_name} · {total} students
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', mt: -0.5 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Summary pills */}
        <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 1 }}>
          {[
            { label: 'Present', val: section.present, color: '#22c55e' },
            { label: 'Absent',  val: section.absent,  color: '#e63946' },
            { label: 'Late',    val: section.late,    color: '#f59e0b' },
            { label: 'Drop-off',val: section.dropoff, color: '#3b82f6' },
            { label: 'Pick-up', val: section.pickup,  color: '#8b5cf6' },
          ].map(s => (
            <Box key={s.label} sx={{
              flex: 1, textAlign: 'center', py: 0.8, borderRadius: '10px',
              bgcolor: alpha(s.color, 0.08),
              border: `1px solid ${alpha(s.color, 0.15)}`,
            }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: s.color, fontFamily: '"Nunito", sans-serif', lineHeight: 1 }}>
                {s.val ?? 0}
              </Typography>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider />

        {/* Student list */}
        <Box sx={{ px: 2, py: 1.5, maxHeight: 340, overflowY: 'auto' }}>
          {sectionStudents.length === 0 ? (
            <Typography sx={{ textAlign: 'center', color: 'text.disabled', py: 3, fontSize: '0.82rem' }}>
              No students in this section.
            </Typography>
          ) : sectionStudents.map((st, i) => {
            const status = getStatus(st.name);
            return (
              <Box key={st.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 1, py: 0.8, borderRadius: '10px',
                bgcolor: i % 2 === 0
                  ? t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
                  : 'transparent',
              }}>
                <Avatar sx={{ width: 26, height: 26, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha(EMERALD, 0.15), color: EMERALD }}>
                  {st.name?.charAt(0)}
                </Avatar>
                <Typography sx={{ flex: 1, fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }}>
                  {st.name}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: statusColor(status) }}>
                  {status}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────
// OVERVIEW PAGE
// ─────────────────────────────────────────────────────────────
export default function OverviewPage({ allStudents, allAttendance }) {
  const { data: overview, loading, error, refetch } = useApi('/overview', [], 30_000);
  const [sectionModal, setSectionModal] = useState(null);

  if (loading) return <LoadingOverlay />;
  if (error)   return <ErrorCard message={error} onRetry={refetch} />;

  const { totals, sections } = overview ?? { totals: {}, sections: [] };
  const today = getLocalDateStr();
  const displayDate = new Date(today + 'T00:00:00').toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const overallPct = totals.totalStudents
    ? Math.round(((totals.present ?? 0) / totals.totalStudents) * 100)
    : 0;

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography sx={{
            fontFamily: '"Nunito", sans-serif', fontWeight: 900,
            fontSize: { xs: '1.4rem', sm: '1.7rem' },
            color: t => t.palette.mode === 'dark' ? EMERALD : '#1e6e4a',
            lineHeight: 1.1,
          }}>
            Good day, Principal! 🏫
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
            <CalendarMonthIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.78rem' }}>
              {displayDate}
            </Typography>
          </Box>
        </Box>

        {/* Overall attendance badge */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1, borderRadius: '14px',
          bgcolor: t => t.palette.mode === 'dark' ? alpha(EMERALD, 0.08) : alpha(EMERALD, 0.06),
          border: `1px solid ${alpha(EMERALD, 0.2)}`,
        }}>
          <TrendingUpIcon sx={{ fontSize: 18, color: EMERALD }} />
          <Box>
            <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, color: EMERALD, fontFamily: '"Nunito", sans-serif', lineHeight: 1 }}>
              {overallPct}%
            </Typography>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7 }}>
              Attendance Rate
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Stat pills ── */}
      <Grid container spacing={1} sx={{ mb: 2.5 }}>
        {[
          { label: 'Students',      value: totals.totalStudents, icon: <SchoolIcon sx={{ fontSize: 15 }} />,           color: EMERALD },
          { label: 'Present',       value: totals.present,       icon: <CheckCircleIcon sx={{ fontSize: 15 }} />,      color: '#22c55e' },
          { label: 'Absent',        value: totals.absent,        icon: <CancelIcon sx={{ fontSize: 15 }} />,           color: '#e63946' },
          { label: 'Late',          value: totals.late,          icon: <AccessTimeIcon sx={{ fontSize: 15 }} />,       color: '#f59e0b' },
          { label: 'Drop-off',      value: totals.dropoff,       icon: <DirectionsCarIcon sx={{ fontSize: 15 }} />,    color: '#3b82f6' },
          { label: 'Pick-up',       value: totals.pickup,        icon: <EscalatorWarningIcon sx={{ fontSize: 15 }} />, color: '#8b5cf6' },
          { label: 'Teachers',      value: totals.totalTeachers, icon: <PeopleIcon sx={{ fontSize: 15 }} />,           color: '#6366f1' },
        ].map(s => (
          <Grid key={s.label} size={{ xs: 6, sm: 4, md: 3, lg: 12/7 }}>
            <StatPill {...s} />
          </Grid>
        ))}
      </Grid>

      {/* ── Sections table ── */}
      <Box sx={{
        borderRadius: '16px',
        border: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}>
        {/* Table header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2,
          px: 2, py: 1.2,
          bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Typography sx={{ flex: '0 0 140px', fontSize: '0.62rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Section / Teacher
          </Typography>
          <Typography sx={{ flex: 1, fontSize: '0.62rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Attendance Rate
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flex: '0 0 auto' }}>
            {['P', 'A', 'L'].map(l => (
              <Typography key={l} sx={{ width: 20, textAlign: 'center', fontSize: '0.62rem', fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {l}
              </Typography>
            ))}
          </Box>
        </Box>

        {/* Rows */}
        {sections.length === 0 ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.82rem' }}>No sections found.</Typography>
          </Box>
        ) : sections.map(s => (
          <Box key={s.teacher_id} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
            <SectionRow section={s} onClick={() => setSectionModal(s)} />
          </Box>
        ))}

        {/* Footer hint */}
        {sections.length > 0 && (
          <Box sx={{
            px: 2, py: 1,
            bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
            borderTop: '1px solid', borderColor: 'divider',
          }}>
            <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 600 }}>
              Click any row to view student details · P = Present · A = Absent · L = Late
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── Section detail modal ── */}
      {sectionModal && (
        <SectionModal
          section={sectionModal}
          allStudents={allStudents}
          allAttendance={allAttendance}
          onClose={() => setSectionModal(null)}
        />
      )}
    </Box>
  );
}