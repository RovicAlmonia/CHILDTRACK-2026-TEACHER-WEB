import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  IconButton, Chip, Avatar, Divider, Grid, Card, CardContent,
  Tabs, Tab, Button, Collapse, Table, TableHead, TableRow,
  TableCell, TableBody, TableContainer,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon          from '@mui/icons-material/Close';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PhoneIcon          from '@mui/icons-material/Phone';
import HomeIcon           from '@mui/icons-material/Home';
import WcIcon             from '@mui/icons-material/Wc';
import PersonIcon         from '@mui/icons-material/Person';
import SchoolIcon         from '@mui/icons-material/School';
import BadgeIcon          from '@mui/icons-material/Badge';
import GroupsIcon         from '@mui/icons-material/Groups';

import {
  EMERALD, isPresent, isAbsent, isLate, fmtDate, initials,
} from '../constants';
import { StatusBadge, InfoRow } from '../components/SharedComponents';

/**
 * TeacherDetailModal
 * Props:
 *   open, onClose, teacher, allStudents, allGuardians, allAttendance
 */
export default function TeacherDetailModal({ open, onClose, teacher, allStudents, allGuardians, allAttendance }) {
  const [tab, setTab]                       = useState(0);
  const [expandedStudent, setExpandedStudent] = useState(null);

  useEffect(() => { if (open) { setTab(0); setExpandedStudent(null); } }, [open]);

  if (!teacher) return null;

  const sectionStudents = (allStudents ?? []).filter(s => s.teacher_id === teacher.id);
  const teacherAtt      = (allAttendance ?? []).filter(a => a.teacher_id === teacher.id);

  const getStudentGuardians      = (studentId) => (allGuardians ?? []).filter(g => g.student_id === studentId);
  const getStudentLastAttendance = (lrn) => {
    const recs = teacherAtt.filter(a => a.lrn === lrn).sort((a, b) => b.date.localeCompare(a.date));
    return recs[0] ?? null;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: '20px', maxHeight: '90vh' } } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{
              width: 56, height: 56,
              bgcolor: alpha(EMERALD, 0.15), color: EMERALD,
              fontWeight: 800, fontSize: '1.2rem', fontFamily: '"Nunito", sans-serif',
              border: `2px solid ${alpha(EMERALD, 0.3)}`,
            }}>
              {initials(teacher.name)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem' }}>{teacher.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                <Chip label={teacher.section} size="small"
                  sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }} />
                <Chip label={`@${teacher.username}`} size="small"
                  sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20,
                    bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                    color: 'text.secondary' }} />
                <Chip label={`${sectionStudents.length} students`} size="small"
                  sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20, bgcolor: alpha(EMERALD, 0.1), color: EMERALD }} />
              </Box>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
        </Box>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ minHeight: 38, '& .MuiTab-root': { minHeight: 38, fontSize: '0.78rem', fontWeight: 700 } }}>
          <Tab label="Teacher Info" />
          <Tab label={`Students (${sectionStudents.length})`} />
          <Tab label="Attendance Log" />
        </Tabs>
      </Box>

      <DialogContent>
        {/* ── Tab 0: Teacher Info ── */}
        {tab === 0 && (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              Personal Information
            </Typography>
            <Card sx={{ borderRadius: '14px', mb: 2 }}>
              <CardContent sx={{ p: '16px !important' }}>
                <Grid container spacing={0}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoRow icon={<PersonIcon fontSize="inherit" />} label="Full Name" value={teacher.name} />
                    <InfoRow icon={<WcIcon fontSize="inherit" />}     label="Gender"    value={teacher.gender} />
                    <InfoRow icon={<BadgeIcon fontSize="inherit" />}  label="Username"  value={`@${teacher.username}`} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <InfoRow icon={<SchoolIcon fontSize="inherit" />} label="Section" value={teacher.section} />
                    <InfoRow icon={<PhoneIcon fontSize="inherit" />}  label="Contact" value={teacher.contact} />
                    <InfoRow icon={<HomeIcon fontSize="inherit" />}   label="Address" value={teacher.address} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
              Attendance Summary (All Time)
            </Typography>
            <Grid container spacing={1.5}>
              {[
                { label: 'Records', val: teacherAtt.length,                                  color: '#64748b' },
                { label: 'Present', val: teacherAtt.filter(r => isPresent(r.status)).length, color: '#22c55e' },
                { label: 'Absent',  val: teacherAtt.filter(r => isAbsent(r.status)).length,  color: '#e63946' },
                { label: 'Late',    val: teacherAtt.filter(r => isLate(r.status)).length,    color: '#f59e0b' },
              ].map(s => (
                <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
                  <Card sx={{ borderRadius: '12px' }}>
                    <CardContent sx={{ p: '12px 14px !important' }}>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1, fontFamily: '"Nunito", sans-serif' }}>
                        {s.val}
                      </Typography>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        {s.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ── Tab 1: Students ── */}
        {tab === 1 && (
          <Box>
            {sectionStudents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
                <Typography sx={{ fontSize: '0.88rem' }}>No students in this section</Typography>
              </Box>
            ) : sectionStudents.map((s) => {
              const guardiansForStudent = getStudentGuardians(s.id);
              const lastAtt             = getStudentLastAttendance(s.lrn);
              const expanded            = expandedStudent === s.id;

              return (
                <Card key={s.id} sx={{
                  borderRadius: '14px', mb: 1.5,
                  border: t => expanded
                    ? `1px solid ${alpha(EMERALD, 0.4)}`
                    : t.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
                  transition: 'border-color 0.2s',
                }}>
                  <CardContent
                    sx={{ p: '14px 16px !important', cursor: 'pointer',
                      '&:hover': { bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } }}
                    onClick={() => setExpandedStudent(expanded ? null : s.id)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{
                        width: 40, height: 40,
                        bgcolor: alpha(s.gender === 'M' ? '#3b82f6' : '#ec4899', 0.15),
                        color: s.gender === 'M' ? '#3b82f6' : '#ec4899',
                        fontWeight: 800, fontSize: '0.85rem', fontFamily: '"Nunito", sans-serif',
                      }}>
                        {initials(s.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.2, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.72rem', color: 'text.secondary' }}>
                            LRN: {s.lrn}
                          </Typography>
                          <Chip label={s.gender === 'M' ? 'Male' : 'Female'} size="small"
                            sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700,
                              bgcolor: alpha(s.gender === 'M' ? '#3b82f6' : '#ec4899', 0.1),
                              color: s.gender === 'M' ? '#3b82f6' : '#ec4899' }} />
                          {guardiansForStudent.length > 0 && (
                            <Chip
                              icon={<GroupsIcon sx={{ fontSize: '10px !important' }} />}
                              label={`${guardiansForStudent.length} guardian${guardiansForStudent.length > 1 ? 's' : ''}`}
                              size="small"
                              sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}
                            />
                          )}
                          {lastAtt && <StatusBadge status={lastAtt.status} />}
                        </Box>
                      </Box>
                      <ArrowForwardIosIcon sx={{ fontSize: 12, color: 'text.disabled',
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </Box>
                  </CardContent>

                  <Collapse in={expanded}>
                    <Divider />
                    <Box sx={{ p: 2 }}>
                      {guardiansForStudent.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary',
                            textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                            Parents & Guardians
                          </Typography>
                          <Grid container spacing={1}>
                            {guardiansForStudent.map(g => (
                              <Grid key={g.id} size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ p: 1.5, borderRadius: '10px',
                                  bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                  display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                                  <Avatar sx={{ width: 34, height: 34, flexShrink: 0,
                                    bgcolor: alpha('#6366f1', 0.15), color: '#6366f1',
                                    fontSize: '0.72rem', fontWeight: 800, fontFamily: '"Nunito", sans-serif' }}>
                                    {initials(g.name)}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.83rem', lineHeight: 1.2 }}>
                                      {g.name}
                                    </Typography>
                                    {g.role && (
                                      <Box sx={{ mt: 0.4 }}>
                                        <Chip label={g.role} size="small"
                                          sx={{ height: 17, fontSize: '0.58rem', fontWeight: 700,
                                            bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }} />
                                      </Box>
                                    )}
                                    {g.contact_number && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        <PhoneIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontFamily: '"Nunito", sans-serif' }}>
                                          {g.contact_number}
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}

                      {(() => {
                        const studentRecs = teacherAtt
                          .filter(a => a.lrn === s.lrn)
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .slice(0, 5);
                        if (!studentRecs.length) return null;
                        return (
                          <Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: 'text.secondary',
                              textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
                              Recent Attendance
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                              {studentRecs.map(r => (
                                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  px: 1.5, py: 0.8, borderRadius: '8px',
                                  bgcolor: t => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{fmtDate(r.date)}</Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <Chip label={r.session} size="small"
                                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
                                        bgcolor: r.session === 'AM' ? alpha('#f59e0b', 0.12) : alpha('#6366f1', 0.12),
                                        color: r.session === 'AM' ? '#f59e0b' : '#6366f1' }} />
                                    <StatusBadge status={r.status} />
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        );
                      })()}
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </Box>
        )}

        {/* ── Tab 2: Attendance Log ── */}
        {tab === 2 && (
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
                {teacherAtt.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      No attendance records
                    </TableCell>
                  </TableRow>
                ) : [...teacherAtt].sort((a, b) => b.date.localeCompare(a.date)).map(r => (
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
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: '10px', fontWeight: 700 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}