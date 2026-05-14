import { useState, useMemo } from 'react';
import {
  Box, Typography, Chip, Grid, Card, CardContent, Avatar,
  Divider, Stack,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { useApi }                    from '../hooks/useApi';
import { LoadingOverlay, ErrorCard } from '../components/SharedComponents';
import TeacherDetailModal            from '../dialogs/TeacherDetailModal';
import { EMERALD, initials }         from '../constants';

/**
 * TeachersPage — no props required (fetches its own data)
 */
export default function TeachersPage() {
  // Poll all required data every 30 seconds
  const { data: teachers,   loading: tLoading, error: tError, refetch: tRefetch } = useApi('/teachers',   [], 30_000);
  const { data: students,   loading: sLoading }  = useApi('/students',   [], 30_000);
  const { data: attendance, loading: aLoading }  = useApi('/attendance', [], 30_000);
  const { data: guardians,  loading: gLoading }  = useApi('/guardians',  [], 30_000);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const countByTeacher = useMemo(() =>
    Object.fromEntries((teachers ?? []).map(t => [
      t.id,
      t.student_count ?? (students ?? []).filter(s => s.teacher_id === t.id).length,
    ])),
    [teachers, students]
  );

  if (tLoading || sLoading || aLoading || gLoading) return <LoadingOverlay />;
  if (tError) return <ErrorCard message={tError} onRetry={tRefetch} />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'text.primary' }}>
          Teachers & Sections
        </Typography>
        <Chip label="Click a teacher for details" size="small"
          sx={{ fontSize: '0.62rem', fontWeight: 600, height: 18, bgcolor: alpha(EMERALD, 0.08), color: EMERALD }} />
      </Box>

      <Grid container spacing={2}>
        {(teachers ?? []).map(t => (
          <Grid key={t.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card onClick={() => setSelectedTeacher(t)} sx={{
              borderRadius: '16px', cursor: 'pointer',
              transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: th => th.palette.mode === 'dark'
                  ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${alpha(EMERALD, 0.3)}`
                  : `0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px ${alpha(EMERALD, 0.25)}`,
                borderColor: alpha(EMERALD, 0.35),
              },
            }}>
              <CardContent sx={{ p: 2.5 }}>
                {/* Teacher header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  {/* ✅ Shows photo_base64 if available, falls back to initials */}
                  <Avatar
                    src={t.photo_base64 ?? undefined}
                    sx={{
                      bgcolor: alpha(EMERALD, 0.15), color: EMERALD,
                      fontWeight: 800, width: 46, height: 46,
                      fontFamily: '"Nunito", sans-serif', fontSize: '1.1rem',
                    }}
                  >
                    {!t.photo_base64 && initials(t.name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.92rem' }}>{t.name}</Typography>
                    <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary' }}>@{t.username}</Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                    <Chip label={`${countByTeacher[t.id] ?? 0} students`} size="small"
                      sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: alpha(EMERALD, 0.1), color: EMERALD }} />
                    <ArrowForwardIosIcon sx={{ fontSize: 10, color: 'text.disabled' }} />
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.5 }} />

                <Stack spacing={0.8}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' }}>Section</Typography>
                    <Chip label={t.section} size="small" sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }} />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' }}>Gender</Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{t.gender}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' }}>Contact</Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontFamily: '"Nunito", sans-serif' }}>{t.contact}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary' }}>Address</Typography>
                    <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.2 }}>{t.address}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TeacherDetailModal
        open={!!selectedTeacher}
        onClose={() => setSelectedTeacher(null)}
        teacher={selectedTeacher}
        allStudents={students ?? []}
        allGuardians={guardians ?? []}
        allAttendance={attendance ?? []}
      />
    </Box>
  );
}