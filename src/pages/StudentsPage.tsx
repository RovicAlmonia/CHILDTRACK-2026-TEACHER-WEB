// Google Font: Nunito — add to your index.html or global CSS:
// <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField,
  Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Skeleton,
  InputAdornment, Avatar, Divider, MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import AddIcon            from '@mui/icons-material/Add';
import SearchIcon         from '@mui/icons-material/Search';
import SaveIcon           from '@mui/icons-material/Save';
import InfoIcon           from '@mui/icons-material/Info';
import SchoolIcon         from '@mui/icons-material/School';
import ClearIcon          from '@mui/icons-material/Clear';
import QrCode2Icon        from '@mui/icons-material/QrCode2';
import DownloadIcon       from '@mui/icons-material/Download';
import LockIcon           from '@mui/icons-material/Lock';
import LockOpenIcon       from '@mui/icons-material/LockOpen';
import PhoneAndroidIcon   from '@mui/icons-material/PhoneAndroid';
import { studentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

// ── Fixed guardian roles ─────────────────────────────────────────────────────
interface PG { role: string; name: string; contact_number: string; }

const DEFAULT_GUARDIANS: PG[] = [
  { role: 'Parent 1', name: '', contact_number: '' },
  { role: 'Parent 2', name: '', contact_number: '' },
  { role: 'Guardian', name: '', contact_number: '' },
];

// ── Role metadata — separate dark/light accent + badge ───────────────────────
const ROLE_META: Record<string, {
  accentDark:  string; accentLight:  string;
  badgeDark:   string; badgeLight:   string;
  icon: string;
}> = {
  'Parent 1': {
    accentDark:  '#4ade80', accentLight:  '#16a34a',
    badgeDark:   'rgba(74,222,128,0.12)',  badgeLight:  'rgba(22,163,74,0.08)',
    icon: '👨',
  },
  'Parent 2': {
    accentDark:  '#22d3ee', accentLight:  '#0891b2',
    badgeDark:   'rgba(34,211,238,0.12)',  badgeLight:  'rgba(8,145,178,0.08)',
    icon: '👩',
  },
  'Guardian': {
    accentDark:  '#a78bfa', accentLight:  '#7c3aed',
    badgeDark:   'rgba(167,139,250,0.12)', badgeLight:  'rgba(124,58,237,0.08)',
    icon: '🧑',
  },
};

const FONT = '"Nunito", sans-serif';

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeEmptyStudent = (section = '') =>
  ({ lrn: '', name: '', age: '', gender: 'Male', contact: '', address: '', section });

// ── Build QR JSON payload ────────────────────────────────────────────────────
// FIX: `allGuardians` must always contain all 3 slots (Parent 1, Parent 2, Guardian)
// in the same fixed order so contacts[] always has exactly 3 entries, matching
// the original HTML system: [parent1Contact, parent2Contact, guardianContact]
//
// Output: {"lrn":"...","student":"...","gender":"M","role":"Parent 1","name":"...","contacts":["09...","09...","09..."]}
function buildQRPayload(
  pg: PG,
  studentName: string,
  studentLrn: string,
  studentGender: string,
  allGuardians: PG[],   // must be full 3-slot array (DEFAULT_GUARDIANS order)
): string {
  const genderCode = studentGender === 'Male' || studentGender === 'M' ? 'M' : 'F';

  // Always extract contacts in fixed role order so the index is predictable
  const roleOrder = ['Parent 1', 'Parent 2', 'Guardian'];
  const contacts = roleOrder.map(role => {
    const found = allGuardians.find(g => g.role === role);
    return found?.contact_number?.trim() ?? '';
  });

  return JSON.stringify({
    lrn:      studentLrn,
    student:  studentName,
    gender:   genderCode,
    role:     pg.role,
    name:     pg.name?.trim() ?? '',
    contacts,
  });
}

// ── Normalise raw parents_guardians into a full 3-slot array ─────────────────
// Always returns exactly [Parent1, Parent2, Guardian] with missing slots filled
// from DEFAULT_GUARDIANS. This guarantees contacts[] has 3 entries in every QR.
function normaliseGuardians(raw: any): PG[] {
  let parsed: PG[] = [];
  try {
    parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? []);
  } catch { parsed = []; }

  return DEFAULT_GUARDIANS.map(def => {
    const found = parsed.find((p: PG) => p.role === def.role);
    return found ? { ...found } : { ...def };
  });
}

// ── Activate Parent Account Button ───────────────────────────────────────────
function ActivateParentButton({
  studentId,
  initialActive,
  onToggle,
}: {
  studentId: number;
  initialActive: boolean;
  onToggle: () => void;
}) {
  const theme        = useTheme();
  const { token }    = useAuth();
  const isDark       = theme.palette.mode === 'dark';
  const [isActive, setIsActive] = useState(initialActive);
  const [loading,  setLoading]  = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/activate-parent`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const err = await res.json();
        console.error(err.error || 'Failed to update account status');
        return;
      }
      const data = await res.json();
      setIsActive(data.is_active);
      onToggle();
    } catch (e) {
      console.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const activeBg       = isDark ? 'rgba(34,211,238,0.12)' : 'rgba(8,145,178,0.08)';
  const activeBorder   = isDark ? 'rgba(34,211,238,0.35)' : 'rgba(8,145,178,0.35)';
  const activeColor    = isDark ? '#22d3ee'               : '#0891b2';
  const activeHoverBg  = isDark ? 'rgba(34,211,238,0.2)'  : 'rgba(8,145,178,0.14)';
  const inactiveBg     = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const inactiveBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const inactiveColor  = isDark ? 'rgba(230,237,243,0.35)' : '#9ca3af';
  const inactiveHoverBg= isDark ? 'rgba(34,211,238,0.08)'  : 'rgba(8,145,178,0.06)';
  const inactiveHoverBorder = isDark ? 'rgba(34,211,238,0.25)' : 'rgba(8,145,178,0.25)';
  const inactiveHoverColor  = isDark ? '#22d3ee'               : '#0891b2';

  return (
    <Tooltip
      title={
        loading
          ? 'Updating…'
          : isActive
            ? 'Parent mobile account is ACTIVE — click to deactivate'
            : 'Parent mobile account is INACTIVE — click to activate'
      }
      arrow placement="top"
    >
      <IconButton
        size="small" onClick={handleToggle} disabled={loading}
        sx={{
          border: '1px solid',
          borderColor:    isActive ? activeBorder   : inactiveBorder,
          bgcolor:        isActive ? activeBg        : inactiveBg,
          color:          isActive ? activeColor     : inactiveColor,
          transition: 'all 0.2s ease',
          '&:hover:not(:disabled)': {
            bgcolor:     isActive ? activeHoverBg   : inactiveHoverBg,
            borderColor: isActive ? activeColor     : inactiveHoverBorder,
            color:       isActive ? activeColor     : inactiveHoverColor,
            transform: 'scale(1.08)',
          },
          '&.Mui-disabled': { opacity: 0.5 },
        }}
      >
        {loading ? (
          <CircularProgress size={13} sx={{ color: 'inherit' }} />
        ) : isActive ? (
          <LockOpenIcon sx={{ fontSize: 15 }} />
        ) : (
          <LockIcon sx={{ fontSize: 15 }} />
        )}
      </IconButton>
    </Tooltip>
  );
}

// ── Single QR card ────────────────────────────────────────────────────────────
// `allGuardians` is always the full 3-slot normalised array so contacts[] in
// the JSON payload always has exactly 3 entries regardless of how many guardians
// actually have names filled in.
function GuardianQRCard({
  pg, studentName, studentLrn, studentGender, allGuardians,
}: {
  pg: PG;
  studentName: string;
  studentLrn: string;
  studentGender: string;
  allGuardians: PG[];   // full 3-slot array
}) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const meta   = ROLE_META[pg.role] || ROLE_META['Parent 1'];
  const accent = isDark ? meta.accentDark : meta.accentLight;
  const badge  = isDark ? meta.badgeDark  : meta.badgeLight;

  const [downloading, setDownloading] = useState(false);
  const [imgLoaded,   setImgLoaded]   = useState(false);

  // ── JSON payload — always has contacts[] with 3 entries ──
  const payload = buildQRPayload(pg, studentName, studentLrn, studentGender, allGuardians);
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}&margin=12&color=0d1117&bgcolor=ffffff`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res  = await fetch(qrUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `QR_${pg.role.replace(/\s+/g, '_')}_${studentName.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { window.open(qrUrl, '_blank'); }
    finally   { setDownloading(false); }
  };

  const cardBg       = isDark ? 'rgba(74,222,128,0.03)' : '#ffffff';
  const cardBorder   = isDark ? `${accent}22`           : `${accent}30`;
  const nameColor    = isDark ? '#e6edf3'                : '#111827';
  const contactColor = isDark ? 'rgba(230,237,243,0.5)' : '#6b7280';
  const emptyColor   = isDark ? 'rgba(230,237,243,0.22)'  : '#9ca3af';
  const btnTextColor = isDark ? '#0d1117' : '#ffffff';

  return (
    <Box sx={{
      borderRadius: '12px',
      border: `1.5px solid ${cardBorder}`,
      background: cardBg,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      '&:hover': {
        borderColor: `${accent}55`,
        boxShadow: isDark
          ? `0 0 0 1px ${accent}20, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 4px 20px rgba(0,0,0,0.1), 0 0 0 1.5px ${accent}55`,
      },
    }}>
      {/* Role badge header */}
      <Box sx={{
        px: 2, py: 1.2,
        background: badge,
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : `${accent}20`}`,
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>{meta.icon}</Typography>
        <Typography sx={{
          fontFamily: FONT, fontWeight: 800,
          fontSize: '0.7rem', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: accent,
        }}>
          {pg.role}
        </Typography>
      </Box>

      {/* Card body */}
      <Box sx={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        px: 2.5, pt: 2.5, pb: 2.5,
        gap: 2, flex: 1,
      }}>
        {/* QR image */}
        <Box sx={{
          position: 'relative', p: '8px', borderRadius: '10px',
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
          bgcolor: '#fff',
          boxShadow: isDark
            ? `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accent}15`
            : `0 2px 12px rgba(0,0,0,0.08), 0 0 0 1.5px ${accent}25`,
        }}>
          {!imgLoaded && (
            <Box sx={{
              position: 'absolute', inset: 0, borderRadius: '8px',
              bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CircularProgress size={22} sx={{ color: accent }} />
            </Box>
          )}
          <img
            src={qrUrl}
            alt={`QR for ${pg.role}`}
            onLoad={() => setImgLoaded(true)}
            style={{
              display: 'block', width: 164, height: 164,
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
              borderRadius: '4px',
            }}
          />
        </Box>

        {/* Name & contact */}
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography sx={{
            fontFamily: FONT, fontWeight: 700, fontSize: '0.95rem',
            color: nameColor, mb: 0.4,
          }}>
            {pg.name
              ? pg.name
              : <Box component="span" sx={{ color: emptyColor, fontStyle: 'italic', fontWeight: 400, fontSize: '0.85rem' }}>
                  Name not set
                </Box>
            }
          </Typography>
          {pg.contact_number ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.6 }}>
              <Typography sx={{ fontSize: '0.72rem' }}>📞</Typography>
              <Typography sx={{
                fontFamily: 'monospace', fontSize: '0.78rem',
                fontWeight: 600, color: contactColor, letterSpacing: '0.03em',
              }}>
                {pg.contact_number}
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.75rem', color: emptyColor, fontFamily: FONT, fontStyle: 'italic' }}>
              No contact
            </Typography>
          )}
        </Box>

        {/* Download button */}
        <Box
          component="button"
          onClick={handleDownload}
          disabled={downloading}
          sx={{
            width: '100%', height: '38px',
            borderRadius: '8px', border: 'none',
            cursor: downloading ? 'not-allowed' : 'pointer',
            background: downloading ? `${accent}30` : accent,
            color: downloading ? accent : btnTextColor,
            fontFamily: FONT, fontWeight: 800,
            fontSize: '0.78rem', letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.18s ease',
            '&:hover:not(:disabled)': {
              filter: 'brightness(1.08)',
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 16px ${accent}50`,
            },
            '&:active:not(:disabled)': { transform: 'scale(0.98)' },
          }}
        >
          {downloading
            ? <><CircularProgress size={12} sx={{ color: accent }} /> Downloading…</>
            : <><DownloadIcon sx={{ fontSize: 14 }} /> Download QR</>
          }
        </Box>
      </Box>
    </Box>
  );
}

// ── Guardian QR Modal ─────────────────────────────────────────────────────────
// `guardians` here is ALWAYS the full 3-slot normalised array so every
// GuardianQRCard gets a complete allGuardians prop and contacts[] stays at 3.
function GuardianQRModal({
  open, onClose, studentName, studentLrn, studentGender, guardians,
}: {
  open: boolean; onClose: () => void;
  studentName: string; studentLrn: string; studentGender: string;
  guardians: PG[];   // full 3-slot normalised array
}) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Cards are shown only for guardians who have a name filled in,
  // but allGuardians (the full array) is still passed for contacts[].
  const namedGuardians = guardians.filter(g => g.name.trim());

  const modalBg     = isDark ? 'rgba(74, 222, 128, 0.03)'  : '#ffffff';
  const modalBorder = isDark ? 'rgba(74,222,128,0.18)' : 'rgba(22,163,74,0.2)';
  const headerBg    = isDark ? 'rgba(74,222,128,0.03)' : 'rgba(22,163,74,0.03)';
  const divider     = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const contentBg   = isDark ? 'rgba(74, 222, 128, 0.03)' : '#f8fafc';
  const footerBg    = isDark ? 'rgba(74, 222, 128, 0.03)' : '#ffffff';
  const greenAccent = isDark ? '#4ade80' : '#16a34a';
  const subColor    = isDark ? 'rgba(230,237,243,0.5)'  : '#6b7280';
  const lrnColor    = isDark ? 'rgba(230,237,243,0.28)' : '#9ca3af';
  const closeBtnColor  = isDark ? 'rgba(230,237,243,0.5)'  : '#6b7280';
  const closeBtnBorder = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.12)';
  const emptyColor  = isDark ? 'rgba(230,237,243,0.25)' : '#9ca3af';
  const emptyBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{
        sx: {
          borderRadius: '14px',
          background: modalBg,
          border: `1px solid ${modalBorder}`,
          boxShadow: isDark ? '0 24px 80px rgba(0,0,0,0.75)' : '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        },
      }}
    >
      {/* Modal header */}
      <Box sx={{
        px: 3.5, pt: 2.8, pb: 2.2,
        borderBottom: `1px solid ${divider}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: headerBg,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: '8px',
            bgcolor: isDark ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.08)',
            border: `1px solid ${isDark ? 'rgba(74,222,128,0.2)' : 'rgba(22,163,74,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode2Icon sx={{ color: greenAccent, fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: FONT, fontWeight: 800,
              fontSize: '1.2rem', letterSpacing: '0.06em',
              textTransform: 'uppercase', color: greenAccent, lineHeight: 1.1,
            }}>
              Guardian QR Codes
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
              <Typography sx={{ fontFamily: FONT, fontSize: '0.78rem', fontWeight: 600, color: subColor }}>
                {studentName}
              </Typography>
              <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: `${greenAccent}50` }} />
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: lrnColor }}>
                LRN: {studentLrn}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3, background: contentBg }}>
        {namedGuardians.length === 0 ? (
          <Box sx={{
            py: 6, textAlign: 'center',
            border: `1px dashed ${emptyBorder}`,
            borderRadius: '10px',
          }}>
            <QrCode2Icon sx={{ fontSize: 40, color: emptyColor, mb: 1.5, display: 'block', mx: 'auto' }} />
            <Typography sx={{ fontFamily: FONT, color: emptyColor, fontStyle: 'italic', fontSize: '0.88rem' }}>
              No guardian names were provided — QR codes cannot be generated.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {namedGuardians.map((pg, i) => (
              <Grid key={i} size={{ xs: 12, sm: 4 }}>
                {/*
                  ↓ pg      = this guardian's own data (name, role, contact)
                  ↓ allGuardians = full 3-slot array so contacts[] stays complete
                */}
                <GuardianQRCard
                  pg={pg}
                  studentName={studentName}
                  studentLrn={studentLrn}
                  studentGender={studentGender}
                  allGuardians={guardians}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>

      <Box sx={{
        px: 3, py: 2,
        borderTop: `1px solid ${divider}`,
        background: footerBg,
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <Box
          component="button"
          onClick={onClose}
          sx={{
            px: 3, height: 38, borderRadius: '8px',
            border: `1px solid ${closeBtnBorder}`,
            bgcolor: 'transparent', color: closeBtnColor,
            fontFamily: FONT, fontWeight: 700,
            fontSize: '0.75rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': {
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              color: isDark ? '#e6edf3' : '#374151',
              borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            },
          }}
        >
          Close
        </Box>
      </Box>
    </Dialog>
  );
}

// ── Shared input/label styles ─────────────────────────────────────────────────
const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '6px', fontSize: '15px', fontFamily: FONT,
    '& fieldset': { borderWidth: '2px', borderColor: '#d0d0d0' },
    '&:hover fieldset': { borderColor: '#2d5016' },
    '&.Mui-focused fieldset': { borderColor: '#2d5016', borderWidth: '2px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#2d5016' },
  '& input, & textarea': { fontFamily: FONT },
};

const labelSx = {
  display: 'block', fontFamily: FONT,
  fontSize: '14px', fontWeight: 700,
  color: 'text.secondary', mb: 0.8,
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentsPage() {
  const { teacher }    = useAuth();
  const teacherSection = teacher?.section ?? '';

  const [rows,      setRows]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [search,    setSearch]    = useState('');
  const [addOpen,   setAddOpen]   = useState(false);
  const [detailRow, setDetailRow] = useState<any | null>(null);
  const [qrRow,     setQrRow]     = useState<any | null>(null);
  const [form,      setForm]      = useState(makeEmptyStudent(teacherSection));
  const [guardians, setGuardians] = useState<PG[]>(DEFAULT_GUARDIANS.map(g => ({ ...g })));

  useEffect(() => {
    if (teacherSection) setForm(p => ({ ...p, section: p.section || teacherSection }));
  }, [teacherSection]);

  const setF = (k: keyof ReturnType<typeof makeEmptyStudent>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const updateGuardian = (i: number, k: keyof PG, v: string) =>
    setGuardians(gs => gs.map((g, idx) => idx === i ? { ...g, [k]: v } : g));

  const load = () => {
    studentsAPI.getAll()
      .then(r => setRows(r.data))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => {
    setForm(makeEmptyStudent(teacherSection));
    setGuardians(DEFAULT_GUARDIANS.map(g => ({ ...g })));
    setError('');
    setAddOpen(true);
  };

  const save = async () => {
    if (!form.lrn.trim())  { setError('LRN is required.'); return; }
    if (!form.name.trim()) { setError('Student name is required.'); return; }
    setError(''); setSaving(true);
    try {
      await studentsAPI.create({
        lrn:     form.lrn.trim(),
        name:    form.name.trim(),
        age:     form.age.trim() || undefined,
        gender:  form.gender,
        contact: form.contact.trim() || undefined,
        address: form.address.trim() || undefined,
        section: form.section.trim() || undefined,
        parents_guardians: guardians
          .filter(g => g.name.trim())
          .map(g => ({
            role: g.role,
            name: g.name.trim(),
            contact_number: g.contact_number.trim() || undefined,
          })),
      });
      setSuccess('Student registered successfully!');
      setAddOpen(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.error ?? 'Failed to register student.');
    } finally { setSaving(false); }
  };

  const parsePGs = (raw: any): PG[] => {
    if (!raw) return [];
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
    catch { return []; }
  };

  const displayed = rows.filter(r =>
    !search || [r.name, r.lrn].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Box>
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography sx={{
            fontFamily: FONT, fontWeight: 800,
            fontSize: { xs: '1.6rem', sm: '2rem' },
            color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
          }}>
            Students
          </Typography>
          <Typography sx={{ fontFamily: FONT, color: 'text.secondary', fontWeight: 500 }}>
            Student enrollment registry
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{
            px: 3, py: 1.2, borderRadius: '12px', fontFamily: FONT,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
            color:   (theme) => theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
            fontWeight: 700,
            '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? '#22c55e' : '#1f3a0f' },
          }}
        >
          Add Student
        </Button>
      </Box>

      {error   && <Alert severity="error"   onClose={() => setError('')}   sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>{success}</Alert>}

      {/* ── Search / stat bar ── */}
      <Card sx={{ mb: 2.5, borderRadius: '14px' }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.12)' : '#f0f7e8',
                  width: 44, height: 44,
                }}>
                  <SchoolIcon sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016' }} />
                </Avatar>
                <Box>
                  <Typography sx={{ fontFamily: FONT, fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Enrolled
                  </Typography>
                  <Typography sx={{
                    fontFamily: FONT, fontWeight: 800, fontSize: '1.8rem', lineHeight: 1,
                    color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#2d5016',
                  }}>
                    {loading ? '…' : rows.length}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 1 }} sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Divider orientation="vertical" sx={{ height: 40, mx: 'auto' }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                placeholder="Search by name or LRN…"
                fullWidth size="small" value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ '& input': { fontFamily: FONT } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 'auto' }}>
              <Button
                variant="outlined" size="small" startIcon={<ClearIcon />}
                onClick={() => setSearch('')}
                sx={{ fontFamily: FONT, borderColor: 'divider', color: 'text.secondary' }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ── Table ── */}
      <Card sx={{ borderRadius: '14px' }}>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ overflowX: 'auto' }}>
            {loading ? (
              <Box sx={{ p: 3 }}>
                {[...Array(6)].map((_, i) => <Skeleton key={i} height={52} sx={{ mb: 0.5 }} />)}
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    {['Student Name', 'LRN', 'Gender', 'Section', 'Parents / Guardians', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontFamily: FONT, fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                        <SchoolIcon sx={{ fontSize: 52, color: 'action.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                        <Typography sx={{ fontFamily: FONT, color: 'text.secondary', fontWeight: 500 }}>
                          {search ? 'No students match your search' : 'No students enrolled yet'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : displayed.map(r => {
                    const pgs    = parsePGs(r.parents_guardians).filter((p: PG) => p.name);
                    const isMale = r.gender === 'M' || r.gender?.toLowerCase() === 'male';
                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{
                              width: 34, height: 34,
                              bgcolor: isMale ? '#eff6ff' : '#fdf2f8',
                              color:   isMale ? '#3b82f6' : '#ec4899',
                              fontSize: '0.82rem', fontWeight: 700,
                            }}>
                              {r.name?.charAt(0)}
                            </Avatar>
                            <Typography sx={{ fontFamily: FONT, fontWeight: 600, fontSize: '0.88rem', color: 'text.primary' }}>
                              {r.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'text.secondary' }}>
                          {r.lrn}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isMale ? 'Male' : 'Female'} size="small"
                            sx={{
                              fontFamily: FONT,
                              bgcolor: isMale ? '#eff6ff' : '#fdf2f8',
                              color:   isMale ? '#3b82f6' : '#ec4899',
                              fontWeight: 700, fontSize: '0.72rem',
                              border: `1px solid ${isMale ? '#bfdbfe' : '#fbcfe8'}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontFamily: FONT, fontSize: '0.82rem', color: 'text.secondary' }}>
                          {r.section || (
                            <Typography component="span" sx={{ fontFamily: FONT, color: 'text.disabled', fontStyle: 'italic', fontSize: '0.82rem' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {pgs.length > 0 ? pgs.map((p: PG, i: number) => {
                              const m = ROLE_META[p.role] || ROLE_META['Parent 1'];
                              return (
                                <Chip key={i} label={p.name} size="small"
                                  sx={{
                                    fontFamily: FONT, fontSize: '0.72rem', fontWeight: 600,
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? m.badgeDark : m.badgeLight,
                                    color:   (theme) => theme.palette.mode === 'dark' ? m.accentDark : m.accentLight,
                                    border:  (theme) => `1px solid ${theme.palette.mode === 'dark' ? m.accentDark : m.accentLight}33`,
                                  }}
                                />
                              );
                            }) : (
                              <Typography sx={{ fontFamily: FONT, color: 'text.disabled', fontSize: '0.82rem', fontStyle: 'italic' }}>
                                None registered
                              </Typography>
                            )}
                          </Box>
                        </TableCell>

                        {/* ── Actions column ── */}
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            <IconButton
                              size="small" title="View details"
                              onClick={() => setDetailRow(r)}
                              sx={{ color: 'text.secondary', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                            >
                              <InfoIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small" title="View Guardian QR Codes"
                              onClick={() => setQrRow(r)}
                              sx={{
                                color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
                                border: '1px solid',
                                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.3)' : 'rgba(22,163,74,0.3)',
                                '&:hover': {
                                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.08)' : 'rgba(22,163,74,0.06)',
                                },
                              }}
                            >
                              <QrCode2Icon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <ActivateParentButton
                              studentId={r.id}
                              initialActive={Boolean(r.parent_is_active)}
                              onToggle={load}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Box>

          {!loading && displayed.length > 0 && (
            <Box sx={{
              px: 3, py: 1.5,
              borderTop: '1px solid', borderColor: 'divider',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 1,
            }}>
              <Typography sx={{ fontFamily: FONT, fontSize: '0.8rem', color: 'text.disabled' }}>
                {displayed.length} student{displayed.length !== 1 ? 's' : ''}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <PhoneAndroidIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                  <Typography sx={{ fontFamily: FONT, fontSize: '0.72rem', color: 'text.disabled' }}>
                    Parent mobile account:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LockOpenIcon sx={{ fontSize: 12, color: (theme) => theme.palette.mode === 'dark' ? '#22d3ee' : '#0891b2' }} />
                  <Typography sx={{ fontFamily: FONT, fontSize: '0.72rem', color: (theme) => theme.palette.mode === 'dark' ? '#22d3ee' : '#0891b2', fontWeight: 600 }}>
                    Active
                  </Typography>
                </Box>
                <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LockIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                  <Typography sx={{ fontFamily: FONT, fontSize: '0.72rem', color: 'text.disabled', fontWeight: 600 }}>
                    Inactive
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ══ Add Student Dialog ══════════════════════════════════════════════ */}
      <Dialog
        open={addOpen} onClose={() => setAddOpen(false)}
        maxWidth="md" fullWidth
        PaperProps={{ sx: { borderRadius: '12px', maxHeight: '92vh' } }}
      >
        <DialogTitle sx={{ pb: 1, pt: 3.5, px: 5 }}>
          <Typography sx={{
            fontFamily: FONT, fontWeight: 800, fontSize: '1.7rem', textAlign: 'center',
            color: (theme) => theme.palette.mode === 'dark' ? '#e0e0e0' : '#1f2937',
          }}>
            Student Registration
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 5, pt: 1.5, pb: 0 }}>
          {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={5}>
            {/* Left column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={labelSx}>Age</Typography>
                  <TextField fullWidth type="number" placeholder="e.g. 10"
                    value={form.age} onChange={setF('age')}
                    inputProps={{ min: 3, max: 25 }} sx={inputSx} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography component="label" sx={labelSx}>Gender *</Typography>
                  <TextField select fullWidth value={form.gender} onChange={setF('gender')} sx={inputSx}>
                    <MenuItem value="Male"   sx={{ fontFamily: FONT }}>Male</MenuItem>
                    <MenuItem value="Female" sx={{ fontFamily: FONT }}>Female</MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={labelSx}>Contact Number</Typography>
                <TextField fullWidth placeholder="e.g. 09123456789"
                  value={form.contact} onChange={setF('contact')} sx={inputSx} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={labelSx}>Address</Typography>
                <TextField fullWidth placeholder="Enter student's address"
                  value={form.address} onChange={setF('address')} sx={inputSx} />
              </Box>

              <Divider sx={{ my: 2 }} />
              <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem', color: 'text.primary', mb: 1.5 }}>
                Parents / Guardians
              </Typography>

              {guardians.map((g, i) => {
                const m      = ROLE_META[g.role] || ROLE_META['Parent 1'];
                const accent = m.accentLight;
                return (
                  <Box key={g.role} sx={{
                    p: 1.5, borderRadius: '8px', mb: 1.5,
                    border: '2px solid', borderColor: `${accent}44`,
                    bgcolor: (theme) => theme.palette.mode === 'dark' ? m.badgeDark : m.badgeLight,
                  }}>
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      px: 1.2, py: 0.4, borderRadius: '6px', mb: 1.2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? m.badgeDark : `${accent}15`,
                      border: `1px solid ${accent}44`,
                    }}>
                      <Typography sx={{ fontSize: '0.85rem' }}>{m.icon}</Typography>
                      <Typography sx={{
                        fontFamily: FONT, fontSize: '0.72rem', fontWeight: 900,
                        color: (theme) => theme.palette.mode === 'dark' ? m.accentDark : m.accentLight,
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        {g.role}
                      </Typography>
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 7 }}>
                        <Typography component="label" sx={{ ...labelSx, fontSize: '12px' }}>Name</Typography>
                        <TextField size="small" fullWidth placeholder={`${g.role} full name`}
                          value={g.name} onChange={e => updateGuardian(i, 'name', e.target.value)} sx={inputSx} />
                      </Grid>
                      <Grid size={{ xs: 5 }}>
                        <Typography component="label" sx={{ ...labelSx, fontSize: '12px' }}>Contact</Typography>
                        <TextField size="small" fullWidth placeholder="09XXXXXXXXX"
                          value={g.contact_number} onChange={e => updateGuardian(i, 'contact_number', e.target.value)} sx={inputSx} />
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
            </Grid>

            {/* Right column */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={labelSx}>Full Name *</Typography>
                <TextField fullWidth autoFocus placeholder="Juan Dela Cruz"
                  value={form.name} onChange={setF('name')} sx={inputSx} />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography component="label" sx={labelSx}>LRN *</Typography>
                <TextField fullWidth placeholder="Learner Reference Number"
                  value={form.lrn} onChange={setF('lrn')} sx={inputSx} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
                  <Typography component="label" sx={{ ...labelSx, mb: 0 }}>Section & Grade</Typography>
                  {teacherSection && (
                    <Chip
                      icon={<LockIcon sx={{ fontSize: '10px !important' }} />}
                      label="auto-filled" size="small"
                      sx={{
                        fontFamily: FONT, fontSize: '0.62rem', height: 18,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.1)' : 'rgba(22,163,74,0.08)',
                        color:   (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
                        border:  (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(74,222,128,0.25)' : 'rgba(22,163,74,0.25)'}`,
                        '& .MuiChip-icon': {
                          color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
                        },
                      }}
                    />
                  )}
                </Box>
                <TextField
                  fullWidth placeholder="e.g. Grade 6 - A"
                  value={form.section} onChange={setF('section')} sx={inputSx}
                  slotProps={teacherSection ? {
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <LockIcon sx={{
                            fontSize: 14,
                            color: (theme) => theme.palette.mode === 'dark'
                              ? 'rgba(74,222,128,0.45)' : 'rgba(22,163,74,0.45)',
                          }} />
                        </InputAdornment>
                      ),
                    },
                  } : undefined}
                />
                {teacherSection && (
                  <Typography sx={{
                    fontFamily: FONT, fontSize: '0.72rem', mt: 0.6,
                    color: (theme) => theme.palette.mode === 'dark'
                      ? 'rgba(74,222,128,0.55)' : 'rgba(22,163,74,0.65)',
                  }}>
                    Pre-filled from your class section. You can still edit it.
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 5, pb: 4, pt: 2.5, flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained" onClick={save} fullWidth
            disabled={saving || !form.lrn.trim() || !form.name.trim()}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              py: 1.6, borderRadius: '6px', fontFamily: FONT, fontWeight: 700, fontSize: '16px',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#4a9eff' : '#2d5016',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#3a8eef' : '#1f3a0f',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(45,80,22,0.3)',
              },
              '&.Mui-disabled': {
                bgcolor: (theme) => theme.palette.mode === 'dark' ? '#5a6a7e' : '#7a9966',
                color: '#fff',
              },
            }}
          >
            {saving ? 'Registering...' : 'Register Student'}
          </Button>
          <Button onClick={() => setAddOpen(false)} fullWidth
            sx={{ fontFamily: FONT, py: 1, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Detail Dialog ── */}
      {detailRow && (
        <Dialog open onClose={() => setDetailRow(null)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{
            fontFamily: FONT, fontWeight: 700,
            color: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
          }}>
            {detailRow.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              {[
                { label: 'LRN',     value: detailRow.lrn,     mono: true },
                { label: 'Gender',  value: detailRow.gender },
                { label: 'Age',     value: detailRow.age },
                { label: 'Section', value: detailRow.section },
              ].filter(f => f.value).map((f, i, arr) => (
                <Box key={f.label} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography sx={{ fontFamily: FONT, fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                      {f.label}
                    </Typography>
                    <Typography sx={{ fontFamily: f.mono ? 'monospace' : FONT, fontWeight: 700, color: 'text.primary' }}>
                      {f.value}
                    </Typography>
                  </Box>
                  {i < arr.length - 1 && <Divider orientation="vertical" flexItem />}
                </Box>
              ))}
            </Box>

            {detailRow.contact && <Typography sx={{ fontFamily: FONT, fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>📞 {detailRow.contact}</Typography>}
            {detailRow.address && <Typography sx={{ fontFamily: FONT, fontSize: '0.85rem', color: 'text.secondary', mb: 1.5 }}>📍 {detailRow.address}</Typography>}

            <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.88rem', color: 'text.primary', mb: 1.5 }}>
              Parents / Guardians
            </Typography>
            {parsePGs(detailRow.parents_guardians).filter((p: PG) => p.name).length === 0 ? (
              <Typography sx={{ fontFamily: FONT, color: 'text.disabled', fontStyle: 'italic', fontSize: '0.88rem' }}>
                No parents or guardians registered.
              </Typography>
            ) : parsePGs(detailRow.parents_guardians).filter((p: PG) => p.name).map((p: PG, i: number) => {
              const m = ROLE_META[p.role] || ROLE_META['Parent 1'];
              return (
                <Box key={i} sx={{
                  p: 1.5, borderRadius: '10px', mb: 1,
                  border: (theme) => `1.5px solid ${theme.palette.mode === 'dark' ? m.accentDark : m.accentLight}33`,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? m.badgeDark : m.badgeLight,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>{p.name}</Typography>
                    <Chip label={`${m.icon} ${p.role}`} size="small"
                      sx={{
                        fontFamily: FONT,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? m.badgeDark : m.badgeLight,
                        color:   (theme) => theme.palette.mode === 'dark' ? m.accentDark : m.accentLight,
                        fontWeight: 700, fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                  {p.contact_number && (
                    <Typography sx={{ fontFamily: FONT, fontSize: '0.8rem', color: 'text.secondary', mt: 0.5 }}>📞 {p.contact_number}</Typography>
                  )}
                </Box>
              );
            })}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button
              onClick={() => { setQrRow(detailRow); setDetailRow(null); }}
              startIcon={<QrCode2Icon />} variant="outlined"
              sx={{
                fontFamily: FONT,
                borderColor: (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
                color:       (theme) => theme.palette.mode === 'dark' ? '#4ade80' : '#16a34a',
              }}
            >
              QR Codes
            </Button>
            <Button onClick={() => setDetailRow(null)} variant="outlined"
              sx={{ fontFamily: FONT, color: 'text.secondary' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Guardian QR Modal ── */}
      {qrRow && (() => {
        // FIX: Always build a full 3-slot normalised array first.
        // This ensures contacts[] in every QR has exactly 3 entries
        // (one per role), even when some guardians have no name/contact.
        const allPGs: PG[] = normaliseGuardians(qrRow.parents_guardians);

        return (
          <GuardianQRModal
            open
            onClose={() => setQrRow(null)}
            studentName={qrRow.name}
            studentLrn={qrRow.lrn}
            studentGender={qrRow.gender ?? 'Male'}
            guardians={allPGs}   // full 3-slot array — modal filters named ones for cards
          />
        );
      })()}
    </Box>
  );
}