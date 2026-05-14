/**
 * ChildTrack — Principal Admin Dashboard (root)
 * + Change Font (Nunito ↔ DM Sans)
 * + Super Dark mode (AMOLED black)
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, IconButton, Tooltip, Button, Avatar,
  Alert, Snackbar,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import DashboardIcon      from '@mui/icons-material/Dashboard';
import PeopleIcon         from '@mui/icons-material/People';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import EventIcon          from '@mui/icons-material/Event';
import SettingsIcon       from '@mui/icons-material/Settings';
import DarkModeIcon       from '@mui/icons-material/DarkMode';
import LightModeIcon      from '@mui/icons-material/LightMode';
import LogoutIcon         from '@mui/icons-material/Logout';
import AddIcon            from '@mui/icons-material/Add';
import ChevronLeftIcon    from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon   from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon  from '@mui/icons-material/CalendarToday';
import TextFieldsIcon     from '@mui/icons-material/TextFields';
import BrightnessLowIcon  from '@mui/icons-material/BrightnessLow';

import { buildTheme, EMERALD, SIDEBAR_W, initials } from './constants';
import { useApi }         from './hooks/useApi';
import { LiveIndicator }  from './components/SharedComponents';

import logoLight from "../../assets/childtrack.png";
import logoDark  from "../../assets/childtrack2.png";

import OverviewPage   from './pages/OverviewPage';
import AttendancePage from './pages/AttendancePage';
import AbsencesPage   from './pages/AbsencesPage';
import EventsPage     from './pages/EventsPage';
import TeachersPage   from './pages/TeachersPage';
import SettingsPage   from './pages/SettingsPage';
import AddEventDialog from './dialogs/AddEventDialog';

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Nunito:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* ─── Font families ─── */
  .pd-root.pd-font-nunito { font-family: 'Nunito', sans-serif; }
  .pd-root.pd-font-dmsans { font-family: 'DM Sans', sans-serif; }

  .pd-root.pd-font-nunito .pd-nav-btn,
  .pd-root.pd-font-nunito .pd-logout-btn,
  .pd-root.pd-font-nunito .pd-page-title,
  .pd-root.pd-font-nunito .pd-greeting,
  .pd-root.pd-font-nunito .pd-greeting-sub { font-family: 'Nunito', sans-serif; }

  .pd-root.pd-font-dmsans .pd-nav-btn,
  .pd-root.pd-font-dmsans .pd-logout-btn,
  .pd-root.pd-font-dmsans .pd-page-title,
  .pd-root.pd-font-dmsans .pd-greeting,
  .pd-root.pd-font-dmsans .pd-greeting-sub { font-family: 'DM Sans', sans-serif; }

  .pd-root.pd-font-dmsans .pd-nav-btn    { font-weight: 500; font-size: 0.9rem; }
  .pd-root.pd-font-dmsans .pd-page-title { font-weight: 700; letter-spacing: 0.03em; }
  .pd-root.pd-font-dmsans .pd-greeting   { font-weight: 600; }
  .pd-root.pd-font-dmsans .pd-logout-btn { font-weight: 600; }
  .pd-root.pd-font-dmsans .MuiTypography-root { font-family: 'DM Sans', sans-serif !important; }
  .pd-root.pd-font-dmsans .MuiTableHead-root .MuiTableCell-root { font-family: 'DM Sans', sans-serif !important; }
  .pd-root.pd-font-dmsans .MuiTableBody-root .MuiTableCell-root { font-family: 'DM Sans', sans-serif !important; }

  /* ─── Root ─── */
  .pd-root { display: flex; height: 100vh; overflow: hidden; -webkit-font-smoothing: antialiased; }
  .pd-root.pd-light { background: #ffffff; color: #1e293b; }
  .pd-root.pd-dark  { background: #1e293b; color: #ffffff; }

  /* ─── Super Dark shell ─── */
  .pd-root.pd-superdark { background: #000000 !important; color: #e2e8f0; }
  .pd-root.pd-superdark .pd-side { background: #000000 !important; border-right-color: rgba(56,197,134,0.12) !important; }
  .pd-root.pd-superdark .pd-brand { border-bottom-color: rgba(56,197,134,0.1) !important; }
  .pd-root.pd-superdark .pd-topbar { background: #000000 !important; border-bottom-color: rgba(56,197,134,0.1) !important; }
  .pd-root.pd-superdark .pd-content { background: #000000 !important; }
  .pd-root.pd-superdark .pd-nav-btn { color: #7a8fa6; }
  .pd-root.pd-superdark .pd-nav-btn:hover { background: rgba(56,197,134,0.07) !important; color: #38c586 !important; }
  .pd-root.pd-superdark .pd-nav-btn.pd-active { background: rgba(56,197,134,0.12) !important; border-color: rgba(56,197,134,0.3) !important; color: #38c586 !important; }
  .pd-root.pd-superdark .pd-sep { background: rgba(56,197,134,0.08) !important; }
  .pd-root.pd-superdark .pd-logout-btn { color: rgba(252,165,165,0.6) !important; }
  .pd-root.pd-superdark .pd-logout-btn:hover { background: rgba(220,38,38,0.08) !important; color: #fca5a5 !important; }
  .pd-root.pd-superdark .pd-menu-btn { border-color: rgba(56,197,134,0.15) !important; background: rgba(56,197,134,0.04) !important; color: #38c586 !important; }
  .pd-root.pd-superdark .pd-date-chip { border-color: rgba(56,197,134,0.15) !important; background: rgba(56,197,134,0.03) !important; color: #6b7280 !important; }
  .pd-root.pd-superdark .pd-greeting { color: #cbd5e1 !important; }
  .pd-root.pd-superdark .pd-greeting-sub { color: #4b5563 !important; }
  .pd-root.pd-superdark .pd-nav-label { color: rgba(100,116,139,0.5) !important; }
  .pd-root.pd-superdark .pd-page-title { color: #38c586 !important; }

  /* ─── MUI overrides — SUPER DARK ─── */
  .pd-root.pd-superdark .MuiPaper-root,
  .pd-root.pd-superdark .MuiCard-root,
  .pd-root.pd-superdark .MuiTableContainer-root,
  .pd-root.pd-superdark .MuiDialog-paper,
  .pd-root.pd-superdark .MuiMenu-paper,
  .pd-root.pd-superdark .MuiPopover-paper { background: #000000 !important; }
  .pd-root.pd-superdark .MuiCard-root { border-color: rgba(56,197,134,0.12) !important; color: #e2e8f0 !important; }
  .pd-root.pd-superdark .MuiTableHead-root .MuiTableCell-root { background: rgba(56,197,134,0.14) !important; }
  .pd-root.pd-superdark .MuiTableBody-root .MuiTableCell-root { background: #000000 !important; border-bottom-color: #111111 !important; color: #9ca3af !important; }
  .pd-root.pd-superdark .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root { background: #0a0a0a !important; }
  .pd-root.pd-superdark .MuiOutlinedInput-root { background: #000000 !important; color: #e2e8f0 !important; }
  .pd-root.pd-superdark .MuiOutlinedInput-notchedOutline { border-color: #1a1a1a !important; }
  .pd-root.pd-superdark .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color: rgba(56,197,134,0.4) !important; }
  .pd-root.pd-superdark .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { border-color: #38c586 !important; }
  .pd-root.pd-superdark .MuiInputLabel-root { color: #4b5563 !important; }
  .pd-root.pd-superdark .MuiInputLabel-root.Mui-focused { color: #38c586 !important; }
  .pd-root.pd-superdark .MuiMenuItem-root { color: #e2e8f0 !important; background: #000000 !important; }
  .pd-root.pd-superdark .MuiMenuItem-root:hover { background: rgba(56,197,134,0.08) !important; }
  .pd-root.pd-superdark .MuiDialogTitle-root { color: #38c586 !important; }
  .pd-root.pd-superdark .MuiDivider-root { border-color: #111111 !important; }
  .pd-root.pd-superdark .MuiSkeleton-root { background: rgba(255,255,255,0.04) !important; }
  .pd-root.pd-superdark .MuiLinearProgress-root { background: rgba(56,197,134,0.08) !important; }
  .pd-root.pd-superdark .MuiLinearProgress-bar { background: linear-gradient(90deg,#38c586,#4ade80) !important; }
  .pd-root.pd-superdark .MuiButton-containedPrimary { background: #38c586 !important; color: #000 !important; }
  .pd-root.pd-superdark .MuiButton-containedPrimary:hover { background: #2da86e !important; }
  .pd-root.pd-superdark .MuiTabs-indicator { background: #38c586 !important; }
  .pd-root.pd-superdark .MuiTab-root.Mui-selected { color: #38c586 !important; }

  /* ─── Sidebar ─── */
  .pd-side {
    width: 240px; flex-shrink: 0; display: flex; flex-direction: column;
    overflow-y: auto; overflow-x: hidden; scrollbar-width: none;
    transition: width 0.25s cubic-bezier(.4,0,.2,1); z-index: 100;
  }
  .pd-side.pd-mini { width: 72px; }
  .pd-side::-webkit-scrollbar { display: none; }
  .pd-root.pd-light .pd-side { background: #ffffff; border-right: 1px solid #e5e7eb; box-shadow: 2px 0 8px rgba(0,0,0,0.04); }
  .pd-root.pd-dark  .pd-side { background: #1e293b; border-right: 1px solid rgba(56,197,134,0.15); }

  /* ─── Brand ─── */
  .pd-brand { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 18px 12px 10px; overflow: hidden; }
  .pd-root.pd-light .pd-brand { border-bottom: 1px solid #f0f0f0; }
  .pd-root.pd-dark  .pd-brand { border-bottom: 1px solid rgba(56,197,134,0.15); }

  .pd-logo-wrap {
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; width: 200px; height: 90px;
    border-radius: 0; overflow: hidden; padding: 0;
    transition: opacity 0.2s, width 0.25s cubic-bezier(.4,0,.2,1), height 0.25s cubic-bezier(.4,0,.2,1);
  }
  .pd-mini .pd-logo-wrap { opacity: 0; width: 0; height: 0; padding: 0; margin: 0; pointer-events: none; }
  .pd-logo-img { width: 200px; height: auto; object-fit: contain; display: block; }

  /* ─── Nav ─── */
  .pd-nav { padding: 12px 8px 0; flex: 1; }
  .pd-nav-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 0 8px; margin: 8px 0 4px; white-space: nowrap; overflow: hidden; transition: opacity 0.2s, height 0.2s; font-family: 'Nunito', sans-serif; }
  .pd-root.pd-light .pd-nav-label { color: #9ca3af; }
  .pd-root.pd-dark  .pd-nav-label { color: rgba(148,163,184,0.5); }
  .pd-mini .pd-nav-label { opacity: 0; height: 0; margin: 0; padding: 0; }

  .pd-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 12px; padding: 9.6px 16px;
    border: none; border-radius: 12px; background: transparent;
    font-size: 0.875rem; font-weight: 600; font-family: 'Nunito', sans-serif;
    cursor: pointer; transition: all 0.15s; margin-bottom: 2px;
    text-align: left; white-space: nowrap; overflow: hidden; position: relative;
  }
  .pd-root.pd-light .pd-nav-btn { color: #6b7280; }
  .pd-root.pd-dark  .pd-nav-btn { color: #94a3b8; }
  .pd-mini .pd-nav-btn { justify-content: center; padding: 9.6px 0; }
  .pd-root.pd-light .pd-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .pd-root.pd-dark  .pd-nav-btn:hover { background: rgba(56,197,134,0.08); color: #38c586; }
  .pd-root.pd-light .pd-nav-btn.pd-active { background: #2d5016; color: #ffffff; font-weight: 700; box-shadow: 0 2px 8px rgba(45,80,22,0.25); }
  .pd-root.pd-dark  .pd-nav-btn.pd-active { background: rgba(56,197,134,0.15); border: 1px solid rgba(56,197,134,0.35); color: #38c586; font-weight: 700; }

  /* ─── Font pill ─── */
  .pd-font-pill {
    margin-left: auto; font-size: 0.58rem; font-weight: 800; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
  }
  .pd-root.pd-light .pd-font-pill { background: rgba(45,80,22,0.12); color: #2d5016; }
  .pd-root.pd-dark  .pd-font-pill,
  .pd-root.pd-superdark .pd-font-pill { background: rgba(56,197,134,0.15); color: #38c586; }
  .pd-mini .pd-font-pill { display: none; }

  /* ─── Super Dark indicator dot ─── */
  .pd-sd-dot {
    margin-left: auto; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    background: #38c586; box-shadow: 0 0 6px #38c586;
  }
  .pd-mini .pd-sd-dot { display: none; }

  .pd-nav-icon { flex-shrink: 0; width: 20px; display: flex; align-items: center; justify-content: center; }
  .pd-nav-text { overflow: hidden; text-overflow: ellipsis; }
  .pd-mini .pd-nav-text { display: none; }

  .pd-sep { height: 1px; margin: 8px 8px; }
  .pd-root.pd-light .pd-sep { background: #f0f0f0; }
  .pd-root.pd-dark  .pd-sep { background: rgba(56,197,134,0.12); }

  /* ─── Footer ─── */
  .pd-footer { padding: 0 8px 16px; flex-shrink: 0; }
  .pd-logout-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: none; border-radius: 8px; background: transparent; font-size: 0.82rem; font-weight: 700; font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.15s; text-align: left; white-space: nowrap; overflow: hidden; }
  .pd-root.pd-light .pd-logout-btn { color: #dc2626; }
  .pd-root.pd-dark  .pd-logout-btn { color: rgba(252,165,165,0.7); }
  .pd-mini .pd-logout-btn { justify-content: center; padding: 10px 0; }
  .pd-root.pd-light .pd-logout-btn:hover { background: #fef2f2; color: #b91c1c; }
  .pd-root.pd-dark  .pd-logout-btn:hover { background: rgba(220,38,38,0.1); color: #fca5a5; }
  .pd-mini .pd-logout-text { display: none; }

  /* ─── Main ─── */
  .pd-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  /* ─── Topbar ─── */
  .pd-topbar { height: 58px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 50; }
  .pd-root.pd-light .pd-topbar { background: #ffffff; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .pd-root.pd-dark  .pd-topbar { background: #1e293b; border-bottom: 1px solid rgba(56,197,134,0.12); }

  .pd-topbar-left { display: flex; align-items: center; gap: 12px; }
  .pd-menu-btn { width: 32px; height: 32px; border-radius: 7px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; border: 1.5px solid transparent; background: transparent; }
  .pd-root.pd-light .pd-menu-btn { border-color: #e5e7eb; background: #f9fafb; color: #6b7280; }
  .pd-root.pd-dark  .pd-menu-btn { border-color: rgba(56,197,134,0.2); background: rgba(56,197,134,0.06); color: #38c586; }
  .pd-root.pd-light .pd-menu-btn:hover { background: #f0f7e8; border-color: #2d5016; color: #2d5016; }
  .pd-root.pd-dark  .pd-menu-btn:hover { background: rgba(56,197,134,0.12); border-color: #38c586; }

  .pd-page-title { font-family: 'Nunito', sans-serif; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .pd-root.pd-light .pd-page-title { color: #2d5016; }
  .pd-root.pd-dark  .pd-page-title { color: #38c586; }

  .pd-topbar-right { display: flex; align-items: center; gap: 10px; }

  .pd-date-chip { height: 30px; padding: 0 11px; border-radius: 7px; font-size: 0.7rem; font-weight: 600; display: flex; align-items: center; gap: 5px; white-space: nowrap; font-family: 'Nunito', sans-serif; }
  .pd-root.pd-light .pd-date-chip { border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280; }
  .pd-root.pd-dark  .pd-date-chip { border: 1.5px solid rgba(56,197,134,0.2); background: rgba(56,197,134,0.05); color: #94a3b8; }

  .pd-greeting { font-size: 0.82rem; font-weight: 700; font-family: 'Nunito', sans-serif; }
  .pd-root.pd-light .pd-greeting { color: #374151; }
  .pd-root.pd-dark  .pd-greeting { color: #e2e8f0; }
  .pd-greeting-sub { font-size: 0.7rem; font-weight: 500; font-family: 'Nunito', sans-serif; }
  .pd-root.pd-light .pd-greeting-sub { color: #6b7280; }
  .pd-root.pd-dark  .pd-greeting-sub { color: #64748b; }

  .pd-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 800; color: #fff; cursor: pointer;
    overflow: hidden; position: relative; transition: box-shadow 0.15s;
    font-family: 'Nunito', sans-serif;
  }
  .pd-avatar:hover { box-shadow: 0 0 0 3px rgba(56,197,134,0.4); }
  .pd-root.pd-light .pd-avatar { background: linear-gradient(135deg, #2d5016, #4a7a25); }
  .pd-root.pd-dark  .pd-avatar { background: linear-gradient(135deg, #38c586, #2da86e); }
  .pd-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

  /* ─── Content ─── */
  .pd-content { flex: 1; overflow: auto; padding: 22px 24px; }
  .pd-root.pd-light .pd-content { background: #ffffff; }
  .pd-root.pd-dark  .pd-content { background: #1e293b; }
`;

// ─────────────────────────────────────────────────────────────
// NAV CONFIG
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { key: 'overview',   label: 'Overview',   icon: <DashboardIcon fontSize="small" /> },
  { key: 'attendance', label: 'Attendance', icon: <CheckCircleIcon fontSize="small" /> },
  { key: 'absences',   label: 'Absences',   icon: <AssignmentLateIcon fontSize="small" /> },
  { key: 'events',     label: 'Events',     icon: <EventIcon fontSize="small" /> },
  { key: 'teachers',   label: 'Teachers',   icon: <PeopleIcon fontSize="small" /> },
  { key: 'settings',   label: 'Settings',   icon: <SettingsIcon fontSize="small" /> },
];

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function PrincipalDashboard() {
  const [mode,            setMode]            = useState('dark');
  const [superDark,       setSuperDark]       = useState(() => localStorage.getItem('pd-superdark') === 'true');
  const [font,            setFont]            = useState(() =>
    (localStorage.getItem('pd-font') ?? 'nunito')
  );
  const [page,            setPage]            = useState('overview');
  const [sidebarOpen,     setSidebarOpen]     = useState(true);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [snack,           setSnack]           = useState({ open: false, msg: '', severity: 'success' });
  const [principalInfo,   setPrincipalInfo]   = useState({ name: 'Principal Admin', photo: null });

  const dark    = mode === 'dark';
  const logoSrc = dark ? logoDark : logoLight;

  // Build MUI theme — now also respects superDark + font
  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: dark ? 'dark' : 'light',
      primary:    { main: dark ? '#38c586' : '#2d5016' },
      background: {
        default: superDark ? '#000000' : dark ? '#0f172a' : '#ffffff',
        paper:   superDark ? '#000000' : dark ? '#1e293b' : '#ffffff',
      },
      text:    { primary: dark ? '#e2e8f0' : '#111827', secondary: dark ? '#94a3b8' : '#6b7280' },
      divider: dark ? '#334155' : '#e5e7eb',
    },
    typography: { fontFamily: font === 'dmsans' ? "'DM Sans', sans-serif" : "'Nunito', sans-serif" },
    components: {
      MuiCard:     { styleOverrides: { root: { borderRadius: 12 } } },
      MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: 'transparent' } } } },
    },
  }), [dark, superDark, font]);

  const { data: teachers,   lastUpdated } = useApi('/teachers',   [], 30_000);
  const { data: students }               = useApi('/students',    [], 30_000);
  const { data: attendance }             = useApi('/attendance',  [], 30_000);
  const { data: principalProfile }       = useApi('/profile',     [], 60_000);

  useEffect(() => {
    if (!principalProfile) return;
    setPrincipalInfo(prev => ({
      name:  principalProfile.name  ?? prev.name,
      photo: principalProfile.photo !== undefined ? principalProfile.photo : prev.photo,
    }));
  }, [principalProfile]);

  const showSnack        = (msg, severity = 'success') => setSnack({ open: true, msg, severity });
  const handleEventSaved = () => { showSnack('Event posted successfully!'); setPage('events'); };

  const toggleMode = () => {
    const next = !dark;
    setMode(next ? 'dark' : 'light');
    // If switching back to light, also disable super dark
    if (!next && superDark) {
      setSuperDark(false);
      localStorage.setItem('pd-superdark', 'false');
    }
  };

  const toggleSuperDark = () => {
    const next = !superDark;
    setSuperDark(next);
    localStorage.setItem('pd-superdark', String(next));
    // Super Dark requires dark mode to be active
    if (next && !dark) {
      setMode('dark');
    }
  };

  const toggleFont = () => {
    const next = font === 'nunito' ? 'dmsans' : 'nunito';
    setFont(next);
    localStorage.setItem('pd-font', next);
  };

  const handleProfileUpdated = (updated) => {
    if (!updated) return;
    setPrincipalInfo(prev => ({
      name:  updated.name  ?? prev.name,
      photo: updated.photo !== undefined ? updated.photo : prev.photo,
    }));
  };

  const isActive  = (key) => page === key;
  const shortDate = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const getHour   = () => new Date().getHours();
  const greeting  = getHour() < 12 ? 'Good Morning' : getHour() < 18 ? 'Good Afternoon' : 'Good Evening';
  const currentPage = NAV_ITEMS.find(n => n.key === page)?.label ?? 'CHILDTrack';

  const rootClass = [
    'pd-root',
    dark ? 'pd-dark' : 'pd-light',
    superDark ? 'pd-superdark' : '',
    font === 'dmsans' ? 'pd-font-dmsans' : 'pd-font-nunito',
  ].filter(Boolean).join(' ');

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <style>{CSS}</style>

      <div className={rootClass}>

        {/* ═══ SIDEBAR ═══ */}
        <aside className={`pd-side${sidebarOpen ? '' : ' pd-mini'}`}>
          <div className="pd-brand">
            <div className="pd-logo-wrap">
              <img
                src={logoSrc}
                alt="CHILDTrack"
                className="pd-logo-img"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          </div>

          <nav className="pd-nav">
            <div className="pd-nav-label">Overview</div>
            {NAV_ITEMS.map(item => (
              <button
                key={item.key}
                className={`pd-nav-btn${isActive(item.key) ? ' pd-active' : ''}`}
                onClick={() => setPage(item.key)}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="pd-nav-icon">{item.icon}</span>
                <span className="pd-nav-text">{item.label}</span>
              </button>
            ))}

            <div className="pd-sep" />
            <div className="pd-nav-label">Preferences</div>

            {/* Dark / Light toggle */}
            <button className="pd-nav-btn" onClick={toggleMode}>
              <span className="pd-nav-icon">
                {dark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </span>
              <span className="pd-nav-text">{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* Super Dark — only visible when dark mode is on */}
            {dark && (
              <button
                className={`pd-nav-btn${superDark ? ' pd-active' : ''}`}
                onClick={toggleSuperDark}
                title={superDark ? 'Disable Super Dark' : 'Enable Super Dark (AMOLED black)'}
              >
                <span className="pd-nav-icon">
                  <BrightnessLowIcon fontSize="small" />
                </span>
                <span className="pd-nav-text">Super Dark</span>
                {superDark && <span className="pd-sd-dot" />}
              </button>
            )}

            {/* Font toggle */}
            <button
              className="pd-nav-btn"
              onClick={toggleFont}
              title={font === 'nunito' ? 'Switch to DM Sans' : 'Switch to Nunito'}
            >
              <span className="pd-nav-icon">
                <TextFieldsIcon fontSize="small" />
              </span>
              <span className="pd-nav-text">
                {font === 'nunito' ? 'Switch to DM Sans' : 'Switch to Nunito'}
              </span>
              <span className="pd-font-pill">
                {font === 'nunito' ? 'Nunito' : 'DM Sans'}
              </span>
            </button>
          </nav>

          <div style={{ flex: 1 }} />

          <div className="pd-footer">
            <div className="pd-sep" />
            <button
              className="pd-logout-btn"
              onClick={() => { localStorage.removeItem('principalToken'); window.location.reload(); }}
              title="Log out"
            >
              <span className="pd-nav-icon"><LogoutIcon fontSize="small" /></span>
              <span className="pd-logout-text">Log Out</span>
            </button>
          </div>
        </aside>

        {/* ═══ MAIN AREA ═══ */}
        <div className="pd-main">
          <div className="pd-topbar">
            <div className="pd-topbar-left">
              <button className="pd-menu-btn" onClick={() => setSidebarOpen(p => !p)}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
                {sidebarOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </button>
              <span className="pd-page-title">{currentPage}</span>
            </div>

            <div className="pd-topbar-right">
              <LiveIndicator lastUpdated={lastUpdated} />

              <Tooltip title="Post Event">
                <Button
                  startIcon={<AddIcon />}
                  variant="contained"
                  size="small"
                  onClick={() => { setPage('events'); setEventDialogOpen(true); }}
                  sx={{ borderRadius: '10px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'none', fontFamily: font === 'dmsans' ? '"DM Sans", sans-serif' : '"Nunito", sans-serif', px: 1.5 }}
                >
                  Post Event
                </Button>
              </Tooltip>

              {/* Avatar + greeting */}
              <div
                className="pd-avatar"
                title="Settings"
                onClick={() => setPage('settings')}
              >
                {principalInfo.photo
                  ? <img src={principalInfo.photo} alt={principalInfo.name} />
                  : initials(principalInfo.name)
                }
              </div>
              <div style={{ textAlign: 'left' }}>
                <div className="pd-greeting">{greeting}{principalInfo.name ? `, ${principalInfo.name}` : ''}</div>
                <div className="pd-greeting-sub">Principal Admin</div>
              </div>

              <div className="pd-date-chip">
                <CalendarTodayIcon sx={{ fontSize: 12 }} />
                {shortDate}
              </div>
            </div>
          </div>

          <div className="pd-content">
            {page === 'overview'   && (
              <OverviewPage
                allStudents={students ?? []}
                allAttendance={attendance ?? []}
                totalTeachers={(teachers ?? []).length}
                totalStudents={(students ?? []).length}
              />
            )}
            {page === 'attendance' && <AttendancePage teachers={teachers ?? []} />}
            {page === 'absences'   && <AbsencesPage   teachers={teachers ?? []} />}
            {page === 'events'     && <EventsPage     onAdd={() => setEventDialogOpen(true)} />}
            {page === 'teachers'   && <TeachersPage />}
            {page === 'settings'   && <SettingsPage   onProfileUpdated={handleProfileUpdated} showSnack={showSnack} />}
          </div>
        </div>
      </div>

      <AddEventDialog
        open={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        onSaved={handleEventSaved}
      />

      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ borderRadius: '12px', fontWeight: 700, fontFamily: font === 'dmsans' ? '"DM Sans", sans-serif' : '"Nunito", sans-serif' }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}