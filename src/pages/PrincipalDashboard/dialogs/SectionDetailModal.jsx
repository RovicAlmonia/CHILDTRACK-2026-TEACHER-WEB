import { useState, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, IconButton,
  Chip, Tabs, Tab, List, ListItem, ListItemAvatar, ListItemText, Avatar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import { EMERALD, norm, isPresent, isLate, isAbsent, getLocalDateStr, initials } from '../constants';
import { StatusBadge } from '../components/SharedComponents';

/**
 * SectionDetailModal
 * Props:
 *   open, onClose, overviewSection, students, attendance
 */
export default function SectionDetailModal({ open, onClose, overviewSection, students, attendance }) {
  const [tab, setTab] = useState(0);
  const today = getLocalDateStr();

  const sectionStudents = students?.filter(s => s.teacher_id === overviewSection?.teacher_id) ?? [];
  const todayAtt = attendance?.filter(a =>
    a.teacher_id === overviewSection?.teacher_id && a.date === today
  ) ?? [];

  const studentStatus = useMemo(() => {
    const map = {};
    todayAtt.forEach(a => {
      if (!map[a.lrn]) map[a.lrn] = [];
      map[a.lrn].push(a);
    });
    return map;
  }, [todayAtt]);

  const categorized = useMemo(() => {
    const present = [], absent = [], late = [], other = [];
    sectionStudents.forEach(s => {
      const records = studentStatus[s.lrn] ?? [];
      if (!records.length) { absent.push({ ...s, records: [] }); return; }
      const hasPresent = records.some(r => isPresent(r.status));
      const hasLate    = records.some(r => isLate(r.status));
      const hasAbsent  = records.some(r => isAbsent(r.status));
      if (hasPresent)      present.push({ ...s, records });
      else if (hasLate)    late.push({ ...s, records });
      else if (hasAbsent)  absent.push({ ...s, records });
      else                 other.push({ ...s, records });
    });
    return { present, absent, late, other };
  }, [sectionStudents, studentStatus]);

  const tabs = [
    { label: 'Present', data: categorized.present, color: '#22c55e' },
    { label: 'Absent',  data: categorized.absent,  color: '#e63946' },
    { label: 'Late',    data: categorized.late,     color: '#f59e0b' },
    { label: 'Other',   data: categorized.other,    color: '#8b5cf6' },
  ];

  if (!overviewSection) return null;
  const total = overviewSection.total ?? sectionStudents.length;
  const pct = total ? Math.round(((overviewSection.present ?? categorized.present.length) / total) * 100) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px', maxHeight: '85vh' } } }}>
      <DialogTitle sx={{ pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem' }}>{overviewSection.section}</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              {overviewSection.teacher_name} · Today's Attendance
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mt: 2, mb: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 600 }}>
              Attendance Rate — {total} students
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: EMERALD }}>{pct}%</Typography>
          </Box>
          <Box sx={{ height: 7, borderRadius: 99, bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
            <Box sx={{ height: '100%', borderRadius: 99, width: `${pct}%`, bgcolor: EMERALD, transition: 'width 0.6s ease' }} />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <Chip key={t.label} size="small" label={`${t.label}: ${t.data.length}`}
              sx={{ fontSize: '0.7rem', fontWeight: 700, height: 22, bgcolor: alpha(t.color, 0.12), color: t.color }} />
          ))}
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, mt: 1 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth"
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, fontSize: '0.78rem', fontWeight: 700 } }}>
          {tabs.map((t, i) => (
            <Tab key={t.label} label={`${t.label} (${t.data.length})`}
              sx={{ color: tab === i ? t.color : 'text.secondary', '&.Mui-selected': { color: t.color } }} />
          ))}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {tabs[tab].data.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            <Typography sx={{ fontSize: '0.88rem' }}>No students in this category</Typography>
          </Box>
        ) : (
          <List disablePadding>
            {tabs[tab].data.map((s, idx) => (
              <ListItem key={s.id} divider={idx < tabs[tab].data.length - 1} sx={{ px: 3, py: 1.5, alignItems: 'flex-start' }}>
                <ListItemAvatar sx={{ mt: 0.3 }}>
                  <Avatar sx={{
                    width: 38, height: 38,
                    bgcolor: alpha(tabs[tab].color, 0.15), color: tabs[tab].color,
                    fontWeight: 800, fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif',
                  }}>
                    {initials(s.name)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontWeight: 700, fontSize: '0.88rem' }}>{s.name}</Typography>}
                  secondary={
                    <Box>
                      <Typography component="span" sx={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.72rem', color: 'text.secondary' }}>
                        LRN: {s.lrn}
                      </Typography>
                      {s.records?.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {s.records.map((r, ri) => (
                            <Box key={ri} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Chip label={r.session} size="small"
                                sx={{ fontSize: '0.6rem', fontWeight: 700, height: 18,
                                  bgcolor: r.session === 'AM' ? alpha('#f59e0b', 0.12) : alpha('#6366f1', 0.12),
                                  color: r.session === 'AM' ? '#f59e0b' : '#6366f1' }} />
                              <StatusBadge status={r.status} />
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}