import { useMemo } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, Chip, Divider } from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddIcon          from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon   from '@mui/icons-material/LocationOn';
import PersonIcon       from '@mui/icons-material/Person';

import { useApi }                  from '../hooks/useApi';
import { LoadingOverlay, ErrorCard } from '../components/SharedComponents';
import { EVENT_TYPE_COLOR, fmtDate, fmtDateTime } from '../constants';

/**
 * EventsPage
 * Props:
 *   onAdd — callback to open AddEventDialog
 */
export default function EventsPage({ onAdd }) {
  // Poll events every 60 seconds
  const { data: events, loading, error, refetch } = useApi('/events', [], 60_000);
  const sorted = useMemo(() =>
    [...(events ?? [])].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [events]
  );

  if (loading) return <LoadingOverlay />;
  if (error)   return <ErrorCard message={error} onRetry={refetch} />;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'text.primary' }}>
          School Events
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={onAdd}
          sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem', textTransform: 'none', px: 2 }}>
          Post Event
        </Button>
      </Box>

      <Grid container spacing={2}>
        {sorted.map(ev => {
          const typeColor = EVENT_TYPE_COLOR[ev.event_type] ?? '#94a3b8';
          return (
            <Grid key={ev.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{
                borderRadius: '16px', height: '100%',
                borderLeft: `4px solid ${typeColor}`,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'translateY(-2px)' },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip label={ev.event_type} size="small"
                      sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: alpha(typeColor, 0.12), color: typeColor }} />
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>{fmtDate(ev.created_at)}</Typography>
                  </Box>

                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 0.5, color: 'text.primary' }}>
                    {ev.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.81rem', color: 'text.secondary', mb: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ev.description}
                  </Typography>

                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <CalendarMonthIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary' }}>
                        {fmtDateTime(ev.scheduled_at)}
                      </Typography>
                    </Box>
                    {ev.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <LocationOnIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{ev.location}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{ev.teacher_name}</Typography>
                    </Box>
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