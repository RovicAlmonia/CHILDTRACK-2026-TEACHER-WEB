import { Box, Typography, Chip, Grid, Card, CardContent, TextField, InputAdornment } from '@mui/material';
import { alpha } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import { useState } from 'react';

import { useApi }                  from '../hooks/useApi';
import { LoadingOverlay, ErrorCard } from '../components/SharedComponents';
import { fmtDate } from '../constants';

/**
 * AbsencesPage
 * Props:
 *   teachers — array from root-level /teachers poll
 */
export default function AbsencesPage({ teachers }) {
  const [search, setSearch] = useState('');
  const queryStr = search ? `?search=${encodeURIComponent(search)}` : '';

  // Poll absences every 60 seconds
  const { data: absences, loading, error, refetch } = useApi(`/absences${queryStr}`, [queryStr], 60_000);

  if (loading) return <LoadingOverlay />;
  if (error)   return <ErrorCard message={error} onRetry={refetch} />;

  const teacherById = Object.fromEntries((teachers ?? []).map(t => [t.id, t]));
  const list = absences ?? [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'text.primary' }}>
          Absence Reports
        </Typography>
        <Chip label={`${list.length} total`} size="small"
          sx={{ fontWeight: 700, bgcolor: alpha('#e63946', 0.12), color: '#e63946' }} />
      </Box>

      {/* Summary cards */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        {[
          { label: 'Total Reports', value: list.length,                                      color: '#64748b' },
          { label: 'Approved',      value: list.filter(a => a.status === 'approved').length,  color: '#22c55e' },
          { label: 'Pending',       value: list.filter(a => a.status === 'pending').length,   color: '#f59e0b' },
          { label: 'Rejected',      value: list.filter(a => a.status === 'rejected').length,  color: '#e63946' },
        ].map(s => (
          <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
            <Card sx={{ borderRadius: '14px' }}>
              <CardContent sx={{ p: '14px 16px !important' }}>
                <Typography sx={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: '"Nunito", sans-serif' }}>
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {s.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <TextField size="small" placeholder="Search student or LRN…" value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: '100%', sm: 320 }, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }} />

      {/* Absence cards */}
      <Grid container spacing={2}>
        {list.map(a => {
          const teacher = teacherById[a.teacher_id];
          return (
            <Grid key={a.id} size={{ xs: 12, md: 6 }}>
              <Card sx={{ borderRadius: '14px' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.92rem' }}>{a.student_name}</Typography>
                      <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.75rem', color: 'text.secondary' }}>
                        LRN: {a.lrn}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                      <Chip label={a.status} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20,
                        bgcolor: a.status === 'approved' ? alpha('#22c55e', 0.12) : alpha('#f59e0b', 0.12),
                        color: a.status === 'approved' ? '#22c55e' : '#f59e0b' }} />
                      <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{fmtDate(a.date)}</Typography>
                    </Box>
                  </Box>

                  <Typography sx={{ fontSize: '0.83rem', color: 'text.primary', mb: 1.5, p: 1.5, borderRadius: '10px', fontStyle: 'italic',
                    bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                    "{a.reason}"
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                        Submitted by
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.submitted_by}</Typography>
                    </Box>
                    {a.parent_contact && (
                      <Box>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                          Contact
                        </Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: '"Nunito", sans-serif' }}>
                          {a.parent_contact}
                        </Typography>
                      </Box>
                    )}
                    {(a.section || teacher) && (
                      <Box>
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.7 }}>
                          Section
                        </Typography>
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                          {a.section ?? teacher?.section}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}