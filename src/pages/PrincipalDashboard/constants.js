import { createTheme, alpha } from '@mui/material/styles';

// ─────────────────────────────────────────────────────────────
// THEME CONSTANTS
// ─────────────────────────────────────────────────────────────
export const EMERALD   = '#38c586';
export const SIDEBAR_W = 240;

export const buildTheme = (mode) => createTheme({
  palette: {
    mode,
    primary:   { main: EMERALD },
    secondary: { main: '#6366f1' },
    background: mode === 'dark'
      ? { default: '#1e293b', paper: '#1e293b' }
      : { default: '#ffffff', paper: '#ffffff' },
    text: mode === 'dark'
      ? { primary: '#ffffff', secondary: '#94a3b8' }
      : { primary: '#1e293b', secondary: '#64748b' },
  },
  typography: { fontFamily: '"Nunito", sans-serif' },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: { containedPrimary: { color: '#fff', fontWeight: 700 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

// ─────────────────────────────────────────────────────────────
// STATUS HELPERS
// ─────────────────────────────────────────────────────────────
export const norm      = (s) => s?.toLowerCase().replace(/[-_\s]/g, '') ?? '';
export const isPresent = (s) => norm(s) === 'present';
export const isAbsent  = (s) => norm(s) === 'absent';
export const isLate    = (s) => norm(s) === 'late';
export const isDropOff = (s) => ['dropoff', 'drop-off'].includes(norm(s));
export const isPickUp  = (s) => ['pickup',  'pick-up'].includes(norm(s));

export const STATUS_COLOR = {
  present: '#22c55e', absent: '#e63946', late: '#f59e0b',
  'drop-off': '#3b82f6', dropoff: '#3b82f6',
  'pick-up': '#8b5cf6', pickup: '#8b5cf6',
};
export const STATUS_LABEL = {
  present: 'Present', absent: 'Absent', late: 'Late',
  dropoff: 'Drop-off', 'drop-off': 'Drop-off',
  pickup: 'Pick-up', 'pick-up': 'Pick-up',
};
export const getStatusColor = (s) => STATUS_COLOR[norm(s)] ?? '#94a3b8';
export const getStatusLabel = (s) => STATUS_LABEL[norm(s)] ?? s;

// ─────────────────────────────────────────────────────────────
// EVENT CONSTANTS
// ─────────────────────────────────────────────────────────────
export const EVENT_TYPE_COLOR = {
  'School Event': '#38c586', 'Conference': '#6366f1',
  'Holiday': '#e63946', 'Reminder': '#f59e0b', 'Other': '#8b5cf6',
};
export const EVENT_TYPES = ['School Event', 'Conference', 'Holiday', 'Reminder', 'Other'];

// ─────────────────────────────────────────────────────────────
// DATE / TIME HELPERS
// ─────────────────────────────────────────────────────────────
export const getLocalDateStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const fmtDate = (iso) =>
  new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

export const fmtTime = (d) =>
  d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// ─────────────────────────────────────────────────────────────
// MISC HELPERS
// ─────────────────────────────────────────────────────────────
export const initials = (name) =>
  name?.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() ?? '?';