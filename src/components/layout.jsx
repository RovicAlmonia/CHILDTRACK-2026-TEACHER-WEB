import { useState, createContext, useMemo, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../api';
import NotificationBell from '../components/NotificationBell';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ShieldIcon from '@mui/icons-material/Shield';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import BrightnessLowIcon from '@mui/icons-material/BrightnessLow';
import ContrastIcon from '@mui/icons-material/Contrast';
import logoLight from '../assets/childtrack.png';
import logoDark from '../assets/childtrack2.png';

export const ColorModeContext = createContext({ toggleColorMode: () => { }, mode: 'light' });

const NAV = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon fontSize="small"/>, countKey: 'dashboard' },
    { label: 'Attendance', path: '/attendance', icon: <CheckCircleIcon fontSize="small"/>, countKey: 'attendance' },
    { label: 'Absences', path: '/absences', icon: <AssignmentLateIcon fontSize="small"/>, countKey: 'absences' },
    { label: 'Dropouts', path: '/dropouts', icon: <ExitToAppIcon fontSize="small"/>, countKey: 'dropouts' },
    { label: 'Guardians', path: '/guardians', icon: <ShieldIcon fontSize="small"/>, countKey: 'guardians' },
    { label: 'Students', path: '/students', icon: <SchoolIcon fontSize="small"/>, countKey: 'students' },
    { label: 'Notifications', path: '/notifications', icon: <NotificationsIcon fontSize="small"/>, countKey: 'notifications' },
];

export const useColorMode = () => {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('ct-theme') : null;
    return (stored === 'dark' ? 'dark' : 'light');
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

async function apiFetch(path, opts = {}) {
    const token = localStorage.getItem('ct_token');
    const res = await fetch(`${API_BASE}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(opts.headers ?? {}),
        },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Request failed');
    return data;
}

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Nunito:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; }

  /* ─── Font families ─── */
  .lt-root.lt-font-nunito  { font-family: 'Nunito', sans-serif; }
  .lt-root.lt-font-dmsans  { font-family: 'DM Sans', sans-serif; }

  .lt-root.lt-font-nunito  .lt-nav-btn,
  .lt-root.lt-font-nunito  .lt-logout-btn,
  .lt-root.lt-font-nunito  .lt-page-title,
  .lt-root.lt-font-nunito  .lt-greeting,
  .lt-root.lt-font-nunito  .lt-greeting-sub,
  .lt-root.lt-font-nunito  .pm-modal,
  .lt-root.lt-font-nunito  .pm-tab,
  .lt-root.lt-font-nunito  .pm-input,
  .lt-root.lt-font-nunito  .pm-select,
  .lt-root.lt-font-nunito  .pm-btn { font-family: 'Nunito', sans-serif; }

  .lt-root.lt-font-dmsans  .lt-nav-btn,
  .lt-root.lt-font-dmsans  .lt-logout-btn,
  .lt-root.lt-font-dmsans  .lt-page-title,
  .lt-root.lt-font-dmsans  .lt-greeting,
  .lt-root.lt-font-dmsans  .lt-greeting-sub,
  .lt-root.lt-font-dmsans  .pm-modal,
  .lt-root.lt-font-dmsans  .pm-tab,
  .lt-root.lt-font-dmsans  .pm-input,
  .lt-root.lt-font-dmsans  .pm-select,
  .lt-root.lt-font-dmsans  .pm-btn { font-family: 'DM Sans', sans-serif; }

  .lt-root.lt-font-dmsans .lt-nav-btn       { font-weight: 500; font-size: 0.9rem; }
  .lt-root.lt-font-dmsans .lt-page-title    { font-weight: 700; letter-spacing: 0.03em; }
  .lt-root.lt-font-dmsans .lt-brand-name    { font-family: 'DM Sans', sans-serif; font-weight: 700; letter-spacing: 0.04em; }
  .lt-root.lt-font-dmsans .lt-greeting      { font-weight: 600; }
  .lt-root.lt-font-dmsans .lt-logout-btn    { font-weight: 600; }
  .lt-root.lt-font-dmsans .pm-label         { font-family: 'DM Sans', sans-serif; }
  .lt-root.lt-font-dmsans .MuiTypography-root { font-family: 'DM Sans', sans-serif !important; }
  .lt-root.lt-font-dmsans .MuiTableHead-root .MuiTableCell-root { font-family: 'DM Sans', sans-serif !important; }
  .lt-root.lt-font-dmsans .MuiTableBody-root .MuiTableCell-root { font-family: 'DM Sans', sans-serif !important; }

  .lt-root { display: flex; height: 100vh; overflow: hidden; -webkit-font-smoothing: antialiased; }
  .lt-root.lt-light { background: #f0f2f5; color: #111827; }
  .lt-root.lt-dark  { background: #0f172a; color: #e2e8f0; }

  /* ─── Super Dark shell ─── */
  .lt-root.lt-superdark { background: #000000 !important; color: #e2e8f0; }
  .lt-root.lt-superdark .lt-side { background: #000000 !important; border-right-color: rgba(56,197,134,0.12) !important; }
  .lt-root.lt-superdark .lt-brand { border-bottom-color: rgba(56,197,134,0.1) !important; }
  .lt-root.lt-superdark .lt-topbar { background: #000000 !important; border-bottom-color: rgba(56,197,134,0.1) !important; }
  .lt-root.lt-superdark .lt-content { background: #000000 !important; }
  .lt-root.lt-superdark .lt-nav-btn { color: #7a8fa6; }
  .lt-root.lt-superdark .lt-nav-btn:hover { background: rgba(56,197,134,0.07) !important; color: #38c586 !important; }
  .lt-root.lt-superdark .lt-nav-btn.lt-active { background: rgba(56,197,134,0.12) !important; border-color: rgba(56,197,134,0.3) !important; color: #38c586 !important; }
  .lt-root.lt-superdark .lt-sep { background: rgba(56,197,134,0.08) !important; }
  .lt-root.lt-superdark .lt-logout-btn { color: rgba(252,165,165,0.6) !important; }
  .lt-root.lt-superdark .lt-logout-btn:hover { background: rgba(220,38,38,0.08) !important; color: #fca5a5 !important; }
  .lt-root.lt-superdark .lt-menu-btn { border-color: rgba(56,197,134,0.15) !important; background: rgba(56,197,134,0.04) !important; color: #38c586 !important; }
  .lt-root.lt-superdark .lt-date-chip { border-color: rgba(56,197,134,0.15) !important; background: rgba(56,197,134,0.03) !important; color: #6b7280 !important; }
  .lt-root.lt-superdark .lt-greeting { color: #cbd5e1 !important; }
  .lt-root.lt-superdark .lt-greeting-sub { color: #4b5563 !important; }
  .lt-root.lt-superdark .lt-nav-label { color: rgba(100,116,139,0.5) !important; }
  .lt-root.lt-superdark .lt-page-title { color: #38c586 !important; }

  /* Profile modal — Super Dark */
  .lt-superdark .pm-modal { background: #000000 !important; border-color: #1a1a1a !important; }
  .lt-superdark .pm-tabs { border-color: #1a1a1a !important; }
  .lt-superdark .pm-input { border-color: #1a1a1a !important; background: #000000 !important; }
  .lt-superdark .pm-select { border-color: #1a1a1a !important; background: #000000 !important; }

  /* ─── Monochrome shell — pure black & white, zero color accents ─── */
  .lt-root.lt-mono { background: #000000 !important; color: #f5f5f5; }
  .lt-root.lt-mono .lt-side { background: #000000 !important; border-right: 1px solid #2a2a2a !important; box-shadow: none !important; }
  .lt-root.lt-mono .lt-brand { border-bottom: 1px solid #1e1e1e !important; }
  .lt-root.lt-mono .lt-topbar { background: #000000 !important; border-bottom: 1px solid #1e1e1e !important; box-shadow: none !important; }
  .lt-root.lt-mono .lt-content { background: #000000 !important; }
  .lt-root.lt-mono .lt-nav-btn { color: #555555; }
  .lt-root.lt-mono .lt-nav-btn:hover { background: #161616 !important; color: #eeeeee !important; }
  .lt-root.lt-mono .lt-nav-btn.lt-active { background: #ffffff !important; border: none !important; color: #000000 !important; box-shadow: none !important; font-weight: 800 !important; }
  .lt-root.lt-mono .lt-sep { background: #1e1e1e !important; }
  .lt-root.lt-mono .lt-logout-btn { color: #555555 !important; }
  .lt-root.lt-mono .lt-logout-btn:hover { background: #1a1a1a !important; color: #ffffff !important; }
  .lt-root.lt-mono .lt-menu-btn { border-color: #2a2a2a !important; background: #111111 !important; color: #cccccc !important; }
  .lt-root.lt-mono .lt-menu-btn:hover { background: #1e1e1e !important; border-color: #444444 !important; color: #ffffff !important; }
  .lt-root.lt-mono .lt-date-chip { border-color: #2a2a2a !important; background: #111111 !important; color: #666666 !important; }
  .lt-root.lt-mono .lt-greeting { color: #eeeeee !important; }
  .lt-root.lt-mono .lt-greeting-sub { color: #555555 !important; }
  .lt-root.lt-mono .lt-nav-label { color: #333333 !important; }
  .lt-root.lt-mono .lt-page-title { color: #ffffff !important; letter-spacing: 0.1em !important; }
  .lt-root.lt-mono .lt-avatar { background: #ffffff !important; color: #000000 !important; box-shadow: none !important; }
  .lt-root.lt-mono .lt-avatar:hover { box-shadow: 0 0 0 2px #ffffff !important; }
  .lt-root.lt-mono .lt-notif-badge { background: #ffffff !important; color: #000000 !important; }
  .lt-root.lt-mono .lt-font-pill { background: rgba(255,255,255,0.08) !important; color: #888888 !important; }
  .lt-root.lt-mono .lt-sd-dot { background: #ffffff !important; box-shadow: 0 0 5px rgba(255,255,255,0.4) !important; }

  /* Profile modal — Mono */
  .lt-mono .pm-modal { background: #000000 !important; border-color: #222222 !important; color: #f5f5f5 !important; }
  .lt-mono .pm-tabs { border-color: #222222 !important; }
  .lt-mono .pm-title { color: #ffffff !important; }
  .lt-mono .pm-close { color: #555555 !important; }
  .lt-mono .pm-close:hover { background: #1a1a1a !important; color: #ffffff !important; }
  .lt-mono .pm-tab { color: #555555 !important; }
  .lt-mono .pm-tab.pm-tab-active { background: #1a1a1a !important; color: #ffffff !important; border-bottom: 2px solid #ffffff !important; }
  .lt-mono .pm-tab:hover:not(.pm-tab-active) { background: #111111 !important; color: #cccccc !important; }
  .lt-mono .pm-photo-ring { background: #ffffff !important; color: #000000 !important; }
  .lt-mono .pm-photo-ring:hover { box-shadow: 0 0 0 3px rgba(255,255,255,0.25) !important; }
  .lt-mono .pm-input { border-color: #222222 !important; background: #000000 !important; color: #f5f5f5 !important; }
  .lt-mono .pm-input:focus { border-color: #ffffff !important; box-shadow: 0 0 0 2px rgba(255,255,255,0.08) !important; }
  .lt-mono .pm-select { border-color: #222222 !important; background: #000000 !important; color: #f5f5f5 !important; }
  .lt-mono .pm-select:focus { border-color: #ffffff !important; }
  .lt-mono .pm-btn-cancel { color: #888888 !important; border-color: #2a2a2a !important; }
  .lt-mono .pm-btn-cancel:hover { background: #111111 !important; color: #ffffff !important; }
  .lt-mono .pm-btn-save { background: #ffffff !important; color: #000000 !important; }
  .lt-mono .pm-btn-save:hover { background: #dddddd !important; }

  /* ─── MUI overrides — MONO (pure B&W, placed last to win cascade) ─── */
  .lt-root.lt-mono .MuiPaper-root,
  .lt-root.lt-mono .MuiCard-root,
  .lt-root.lt-mono .MuiTableContainer-root,
  .lt-root.lt-mono .MuiDialog-paper,
  .lt-root.lt-mono .MuiMenu-paper,
  .lt-root.lt-mono .MuiPopover-paper { background: #000000 !important; }
  .lt-root.lt-mono .MuiCard-root { border: 1px solid #1e1e1e !important; box-shadow: none !important; color: #e5e5e5 !important; border-radius: 12px !important; }
  .lt-root.lt-mono .MuiTableHead-root .MuiTableCell-root { background: #ffffff !important; color: #000000 !important; font-size: 0.68rem !important; font-weight: 800 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; border-bottom: none !important; }
  .lt-root.lt-mono .MuiTableBody-root .MuiTableCell-root { background: #000000 !important; border-bottom: 1px solid #141414 !important; color: #888888 !important; }
  .lt-root.lt-mono .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root { background: #0f0f0f !important; color: #cccccc !important; }
  .lt-root.lt-mono .MuiOutlinedInput-root { background: #000000 !important; color: #f5f5f5 !important; }
  .lt-root.lt-mono .MuiOutlinedInput-notchedOutline { border-color: #2a2a2a !important; }
  .lt-root.lt-mono .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color: #666666 !important; }
  .lt-root.lt-mono .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { border-color: #ffffff !important; }
  .lt-root.lt-mono .MuiInputLabel-root { color: #444444 !important; }
  .lt-root.lt-mono .MuiInputLabel-root.Mui-focused { color: #ffffff !important; }
  .lt-root.lt-mono .MuiSelect-select { color: #f5f5f5 !important; }
  .lt-root.lt-mono .MuiMenuItem-root { color: #cccccc !important; background: #000000 !important; }
  .lt-root.lt-mono .MuiMenuItem-root:hover { background: #141414 !important; color: #ffffff !important; }
  .lt-root.lt-mono .MuiDialogTitle-root { color: #ffffff !important; letter-spacing: 0.08em !important; }
  .lt-root.lt-mono .MuiDivider-root { border-color: #1a1a1a !important; }
  .lt-root.lt-mono .MuiSkeleton-root { background: rgba(255,255,255,0.04) !important; }
  .lt-root.lt-mono .MuiLinearProgress-root { background: rgba(255,255,255,0.06) !important; }
  .lt-root.lt-mono .MuiLinearProgress-bar { background: #ffffff !important; }
  .lt-root.lt-mono .MuiButton-contained { border-radius: 8px !important; }
  .lt-root.lt-mono .MuiButton-containedPrimary { background: #ffffff !important; color: #000000 !important; }
  .lt-root.lt-mono .MuiButton-containedPrimary:hover { background: #dddddd !important; }
  .lt-root.lt-mono .MuiTypography-root { color: #cccccc !important; }
  .lt-root.lt-mono .MuiAlert-standardError { background: rgba(255,255,255,0.04) !important; color: #cccccc !important; border-left: 3px solid #ffffff !important; }
  .lt-root.lt-mono .MuiAlert-standardSuccess { background: rgba(255,255,255,0.04) !important; color: #cccccc !important; border-left: 3px solid #ffffff !important; }
  .lt-root.lt-mono .MuiTabs-indicator { background: #ffffff !important; }
  .lt-root.lt-mono .MuiTab-root.Mui-selected { color: #ffffff !important; }
  .lt-root.lt-mono .recharts-cartesian-grid line { stroke: rgba(255,255,255,0.06) !important; }
  .lt-root.lt-mono .recharts-text,
  .lt-root.lt-mono .recharts-cartesian-axis-tick-value { fill: #444444 !important; }

  .lt-side {
    width: 240px; flex-shrink: 0; display: flex; flex-direction: column;
    overflow-y: auto; overflow-x: hidden; scrollbar-width: none;
    transition: width 0.25s cubic-bezier(.4,0,.2,1); z-index: 100;
  }
  .lt-side.lt-mini { width: 72px; }
  .lt-side::-webkit-scrollbar { display: none; }
  .lt-root.lt-light .lt-side { background: #ffffff; border-right: 1px solid #e5e7eb; box-shadow: 2px 0 8px rgba(0,0,0,0.04); }
  .lt-root.lt-dark  .lt-side { background: #1e293b; border-right: 1px solid rgba(56,197,134,0.15); }

  .lt-brand { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; padding: 18px 12px 10px; overflow: hidden; }
  .lt-root.lt-light .lt-brand { border-bottom: 1px solid #f0f0f0; }
  .lt-root.lt-dark  .lt-brand { border-bottom: 1px solid rgba(56,197,134,0.15); }

  .lt-logo-wrap {
    display: flex; align-items: center; justify-content: center;
    background: transparent; border: none; width: 200px; height: 90px;
    border-radius: 0; overflow: hidden; padding: 0;
    transition: opacity 0.2s, width 0.25s cubic-bezier(.4,0,.2,1), height 0.25s cubic-bezier(.4,0,.2,1);
  }
  .lt-mini .lt-logo-wrap { opacity: 0; width: 0; height: 0; padding: 0; margin: 0; pointer-events: none; }
  .lt-logo-img { width: 200px; height: auto; object-fit: contain; display: block; }

  .lt-brand-name { margin-top: 9px; font-family: 'Nunito', sans-serif; font-size: 1.15rem; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; line-height: 1; text-align: center; transition: opacity 0.2s; }
  .lt-root.lt-light .lt-brand-name { color: #2d5016; }
  .lt-root.lt-dark  .lt-brand-name { color: #38c586; }
  .lt-mini .lt-brand-name { opacity: 0; height: 0; margin: 0; overflow: hidden; }

  .lt-brand-sub { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 2px; text-align: center; transition: opacity 0.2s; }
  .lt-root.lt-light .lt-brand-sub { color: #9ca3af; }
  .lt-root.lt-dark  .lt-brand-sub { color: rgba(56,197,134,0.5); }
  .lt-mini .lt-brand-sub { opacity: 0; height: 0; overflow: hidden; }

  .lt-nav { padding: 12px 8px 0; flex: 1; }
  .lt-nav-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 0 8px; margin: 8px 0 4px; white-space: nowrap; overflow: hidden; transition: opacity 0.2s, height 0.2s; }
  .lt-root.lt-light .lt-nav-label { color: #9ca3af; }
  .lt-root.lt-dark  .lt-nav-label { color: rgba(148,163,184,0.5); }
  .lt-mini .lt-nav-label { opacity: 0; height: 0; margin: 0; padding: 0; }

  .lt-nav-btn {
    width: 100%; display: flex; align-items: center; gap: 12px; padding: 9.6px 16px;
    border: none; border-radius: 12px; background: transparent;
    font-size: 0.875rem; font-weight: 600; font-family: 'Nunito', sans-serif;
    cursor: pointer; transition: all 0.15s; margin-bottom: 2px;
    text-align: left; white-space: nowrap; overflow: hidden; position: relative;
  }
  .lt-root.lt-light .lt-nav-btn { color: #6b7280; }
  .lt-root.lt-dark  .lt-nav-btn { color: #94a3b8; }
  .lt-mini .lt-nav-btn { justify-content: center; padding: 9.6px 0; }
  .lt-root.lt-light .lt-nav-btn:hover { background: #f3f4f6; color: #111827; }
  .lt-root.lt-dark  .lt-nav-btn:hover { background: rgba(56,197,134,0.08); color: #38c586; }
  .lt-root.lt-light .lt-nav-btn.lt-active { background: #2d5016; color: #ffffff; font-weight: 700; box-shadow: 0 2px 8px rgba(45,80,22,0.25); }
  .lt-root.lt-dark  .lt-nav-btn.lt-active { background: rgba(56,197,134,0.15); border: 1px solid rgba(56,197,134,0.35); color: #38c586; font-weight: 700; }

  .lt-font-pill {
    margin-left: auto; font-size: 0.58rem; font-weight: 800; letter-spacing: 0.06em;
    text-transform: uppercase; padding: 2px 6px; border-radius: 4px; flex-shrink: 0;
  }
  .lt-root.lt-light .lt-font-pill { background: rgba(45,80,22,0.12); color: #2d5016; }
  .lt-root.lt-dark  .lt-font-pill,
  .lt-root.lt-superdark .lt-font-pill { background: rgba(56,197,134,0.15); color: #38c586; }
  .lt-mini .lt-font-pill { display: none; }

  .lt-sd-dot {
    margin-left: auto; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    background: #38c586; box-shadow: 0 0 6px #38c586;
  }
  .lt-mini .lt-sd-dot { display: none; }

  .lt-notif-badge {
    position: absolute; top: 5px; right: 7px; min-width: 17px; height: 17px;
    border-radius: 9px; background: #e63946; color: #fff; font-size: 0.6rem;
    font-weight: 800; display: flex; align-items: center; justify-content: center; padding: 0 3px;
  }
  .lt-mini .lt-notif-badge { top: 3px; right: 3px; }

  .lt-nav-icon { flex-shrink: 0; width: 20px; display: flex; align-items: center; justify-content: center; }
  .lt-nav-text { overflow: hidden; text-overflow: ellipsis; }
  .lt-mini .lt-nav-text { display: none; }

  .lt-sep { height: 1px; margin: 8px 8px; }
  .lt-root.lt-light .lt-sep { background: #f0f0f0; }
  .lt-root.lt-dark  .lt-sep { background: rgba(56,197,134,0.12); }

  .lt-footer { padding: 0 8px 16px; flex-shrink: 0; }
  .lt-logout-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: none; border-radius: 8px; background: transparent; font-size: 0.82rem; font-weight: 700; font-family: 'Nunito', sans-serif; cursor: pointer; transition: all 0.15s; text-align: left; white-space: nowrap; overflow: hidden; }
  .lt-root.lt-light .lt-logout-btn { color: #dc2626; }
  .lt-root.lt-dark  .lt-logout-btn { color: rgba(252,165,165,0.7); }
  .lt-mini .lt-logout-btn { justify-content: center; padding: 10px 0; }
  .lt-root.lt-light .lt-logout-btn:hover { background: #fef2f2; color: #b91c1c; }
  .lt-root.lt-dark  .lt-logout-btn:hover { background: rgba(220,38,38,0.1); color: #fca5a5; }
  .lt-mini .lt-logout-text { display: none; }

  .lt-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .lt-topbar { height: 58px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 50; }
  .lt-root.lt-light .lt-topbar { background: #ffffff; border-bottom: 1px solid #e5e7eb; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
  .lt-root.lt-dark  .lt-topbar { background: #1e293b; border-bottom: 1px solid rgba(56,197,134,0.12); }

  .lt-topbar-left { display: flex; align-items: center; gap: 12px; }
  .lt-menu-btn { width: 32px; height: 32px; border-radius: 7px; cursor: pointer; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; border: 1.5px solid transparent; background: transparent; }
  .lt-root.lt-light .lt-menu-btn { border-color: #e5e7eb; background: #f9fafb; color: #6b7280; }
  .lt-root.lt-dark  .lt-menu-btn { border-color: rgba(56,197,134,0.2); background: rgba(56,197,134,0.06); color: #38c586; }
  .lt-root.lt-light .lt-menu-btn:hover { background: #f0f7e8; border-color: #2d5016; color: #2d5016; }
  .lt-root.lt-dark  .lt-menu-btn:hover { background: rgba(56,197,134,0.12); border-color: #38c586; }

  .lt-page-title { font-family: 'Nunito', sans-serif; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .lt-root.lt-light .lt-page-title { color: #2d5016; }
  .lt-root.lt-dark  .lt-page-title { color: #38c586; }

  .lt-topbar-right { display: flex; align-items: center; gap: 10px; }

  .lt-date-chip { height: 30px; padding: 0 11px; border-radius: 7px; font-size: 0.7rem; font-weight: 600; display: flex; align-items: center; gap: 5px; white-space: nowrap; }
  .lt-root.lt-light .lt-date-chip { border: 1.5px solid #e5e7eb; background: #f9fafb; color: #6b7280; }
  .lt-root.lt-dark  .lt-date-chip { border: 1.5px solid rgba(56,197,134,0.2); background: rgba(56,197,134,0.05); color: #94a3b8; }

  .lt-greeting { font-size: 0.82rem; font-weight: 700; }
  .lt-root.lt-light .lt-greeting { color: #374151; }
  .lt-root.lt-dark  .lt-greeting { color: #e2e8f0; }
  .lt-greeting-sub { font-size: 0.7rem; font-weight: 500; }
  .lt-root.lt-light .lt-greeting-sub { color: #6b7280; }
  .lt-root.lt-dark  .lt-greeting-sub { color: #64748b; }

  .lt-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.85rem; font-weight: 800; color: #fff; cursor: pointer;
    overflow: hidden; position: relative; transition: box-shadow 0.15s;
  }
  .lt-avatar:hover { box-shadow: 0 0 0 3px rgba(56,197,134,0.4); }
  .lt-root.lt-light .lt-avatar { background: linear-gradient(135deg, #2d5016, #4a7a25); }
  .lt-root.lt-dark  .lt-avatar { background: linear-gradient(135deg, #38c586, #2da86e); }
  .lt-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

  .lt-content { flex: 1; overflow: auto; padding: 22px 24px; }
  .lt-root.lt-light .lt-content { background: #ffffff; }
  .lt-root.lt-dark  .lt-content { background: #1e293b; }

  .pm-overlay {
    position: fixed; inset: 0; z-index: 999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);
    animation: pmFadeIn 0.18s ease;
  }
  @keyframes pmFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .pm-modal {
    width: 520px; max-width: 96vw; max-height: 90vh; overflow-y: auto;
    border-radius: 16px; padding: 0;
    animation: pmSlideUp 0.22s cubic-bezier(.4,0,.2,1);
    scrollbar-width: thin;
  }
  @keyframes pmSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  .lt-light .pm-modal { background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 20px 60px rgba(0,0,0,0.18); color: #111827; }
  .lt-dark  .pm-modal { background: #1e293b; border: 1px solid #334155; box-shadow: 0 20px 60px rgba(0,0,0,0.5); color: #e2e8f0; }

  .pm-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
  .pm-title { font-size: 1rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
  .lt-light .pm-title { color: #2d5016; }
  .lt-dark  .pm-title { color: #38c586; }

  .pm-close { width: 30px; height: 30px; border-radius: 8px; border: none; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; background: transparent; }
  .lt-light .pm-close { color: #6b7280; }
  .lt-dark  .pm-close { color: #94a3b8; }
  .lt-light .pm-close:hover { background: #f3f4f6; color: #111827; }
  .lt-dark  .pm-close:hover { background: rgba(255,255,255,0.07); color: #e2e8f0; }

  .pm-tabs { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid; margin-bottom: 4px; }
  .lt-light .pm-tabs { border-color: #e5e7eb; }
  .lt-dark  .pm-tabs { border-color: #334155; }

  .pm-tab { padding: 7px 16px; border-radius: 8px 8px 0 0; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 700; font-family: 'Nunito', sans-serif; background: transparent; transition: all 0.15s; letter-spacing: 0.04em; display: flex; align-items: center; gap: 6px; }
  .lt-light .pm-tab { color: #6b7280; }
  .lt-dark  .pm-tab { color: #64748b; }
  .lt-light .pm-tab.pm-tab-active { background: #f0f7e8; color: #2d5016; border-bottom: 2px solid #2d5016; }
  .lt-dark  .pm-tab.pm-tab-active { background: rgba(56,197,134,0.1); color: #38c586; border-bottom: 2px solid #38c586; }
  .lt-light .pm-tab:hover:not(.pm-tab-active) { background: #f3f4f6; }
  .lt-dark  .pm-tab:hover:not(.pm-tab-active) { background: rgba(255,255,255,0.05); }

  .pm-photo-area { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 24px 0; }
  .pm-photo-ring { width: 90px; height: 90px; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; color: #fff; position: relative; cursor: pointer; transition: box-shadow 0.15s; }
  .pm-photo-ring:hover { box-shadow: 0 0 0 4px rgba(56,197,134,0.4); }
  .lt-light .pm-photo-ring { background: linear-gradient(135deg,#2d5016,#4a7a25); }
  .lt-dark  .pm-photo-ring { background: linear-gradient(135deg,#38c586,#2da86e); }
  .pm-photo-ring img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
  .pm-photo-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; }
  .pm-photo-ring:hover .pm-photo-overlay { opacity: 1; }
  .pm-photo-hint { font-size: 0.7rem; font-weight: 600; opacity: 0.6; }

  .pm-form { padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 12px; }
  .pm-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pm-field { display: flex; flex-direction: column; gap: 4px; }
  .pm-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.6; }
  .pm-input { padding: 8px 11px; border-radius: 8px; border: 1.5px solid; font-size: 0.83rem; font-family: 'Nunito', sans-serif; font-weight: 600; outline: none; transition: border-color 0.15s, box-shadow 0.15s; width: 100%; }
  .lt-light .pm-input { border-color: #d1d5db; background: #f9fafb; color: #111827; }
  .lt-dark  .pm-input { border-color: #334155; background: #0f172a; color: #e2e8f0; }
  .lt-light .pm-input:focus { border-color: #2d5016; box-shadow: 0 0 0 3px rgba(45,80,22,0.12); }
  .lt-dark  .pm-input:focus { border-color: #38c586; box-shadow: 0 0 0 3px rgba(56,197,134,0.15); }

  .pm-select { padding: 8px 11px; border-radius: 8px; border: 1.5px solid; font-size: 0.83rem; font-family: 'Nunito', sans-serif; font-weight: 600; outline: none; transition: border-color 0.15s; width: 100%; appearance: none; }
  .lt-light .pm-select { border-color: #d1d5db; background: #f9fafb; color: #111827; }
  .lt-dark  .pm-select { border-color: #334155; background: #0f172a; color: #e2e8f0; }
  .lt-light .pm-select:focus { border-color: #2d5016; }
  .lt-dark  .pm-select:focus { border-color: #38c586; }

  .pm-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 4px; }
  .pm-btn { padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.82rem; font-weight: 700; font-family: 'Nunito', sans-serif; transition: all 0.15s; }
  .pm-btn-cancel { background: transparent; }
  .lt-light .pm-btn-cancel { color: #6b7280; border: 1.5px solid #e5e7eb; }
  .lt-dark  .pm-btn-cancel { color: #94a3b8; border: 1.5px solid #334155; }
  .lt-light .pm-btn-cancel:hover { background: #f3f4f6; }
  .lt-dark  .pm-btn-cancel:hover { background: rgba(255,255,255,0.05); }
  .pm-btn-save { color: #fff; }
  .lt-light .pm-btn-save { background: #2d5016; }
  .lt-dark  .pm-btn-save { background: #38c586; }
  .lt-light .pm-btn-save:hover { background: #3a6620; }
  .lt-dark  .pm-btn-save:hover { background: #2da86e; }
  .pm-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

  .pm-msg { font-size: 0.75rem; font-weight: 700; padding: 8px 12px; border-radius: 8px; text-align: center; }
  .pm-msg-ok { background: rgba(22,163,74,0.12); color: #16a34a; border: 1px solid rgba(22,163,74,0.25); }
  .pm-msg-err { background: rgba(220,38,38,0.1); color: #dc2626; border: 1px solid rgba(220,38,38,0.2); }
  .pm-pw-hint { font-size: 0.68rem; opacity: 0.55; margin-top: 2px; }

  /* ─── MUI overrides — LIGHT ─── */
  .lt-root.lt-light .MuiCard-root { background: #ffffff !important; border: 1px solid #e9ecef !important; box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important; color: #111827 !important; border-radius: 12px !important; }
  .lt-root.lt-light .MuiTableContainer-root { background: #ffffff !important; }
  .lt-root.lt-light .MuiTableHead-root .MuiTableCell-root { background: #2d5016 !important; color: #fff !important; font-size: 0.68rem !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; font-family: 'Nunito', sans-serif !important; border-bottom: none !important; }
  .lt-root.lt-light .MuiTableBody-root .MuiTableCell-root { border-bottom: 1px solid #f3f4f6 !important; color: #374151 !important; font-family: 'Nunito', sans-serif !important; }
  .lt-root.lt-light .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root { background: #f9fbe7 !important; }
  .lt-root.lt-light .MuiOutlinedInput-root { color: #111827 !important; background: #ffffff !important; }
  .lt-root.lt-light .MuiOutlinedInput-notchedOutline { border-color: #d1d5db !important; }
  .lt-root.lt-light .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color: #2d5016 !important; }
  .lt-root.lt-light .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { border-color: #2d5016 !important; }
  .lt-root.lt-light .MuiInputLabel-root { color: #6b7280 !important; }
  .lt-root.lt-light .MuiInputLabel-root.Mui-focused { color: #2d5016 !important; }
  .lt-root.lt-light .MuiSelect-select { color: #111827 !important; }
  .lt-root.lt-light .MuiMenu-paper, .lt-root.lt-light .MuiPopover-paper { background: #ffffff !important; border: 1px solid #0f172a !important; }
  .lt-root.lt-light .MuiMenuItem-root { color: #374151 !important; }
  .lt-root.lt-light .MuiMenuItem-root:hover { background: #f0f7e8 !important; }
  .lt-root.lt-light .MuiDialog-paper { background: #ffffff !important; color: #111827 !important; border-radius: 14px !important; }
  .lt-root.lt-light .MuiDialogTitle-root { color: #2d5016 !important; font-family: 'Nunito', sans-serif !important; font-weight: 800 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; }
  .lt-root.lt-light .MuiLinearProgress-bar { background: linear-gradient(90deg,#2d5016,#4a7a25) !important; }
  .lt-root.lt-light .MuiDivider-root { border-color: #e5e7eb !important; }
  .lt-root.lt-light .MuiButton-contained { border-radius: 8px !important; font-family: 'Nunito', sans-serif !important; font-weight: 700 !important; }
  .lt-root.lt-light .MuiTypography-root { font-family: 'Nunito', sans-serif; }
  .lt-root.lt-light .MuiAlert-standardError { background: #fef2f2 !important; color: #991b1b !important; border-left: 3px solid #dc2626 !important; }
  .lt-root.lt-light .MuiAlert-standardSuccess { background: #f0fdf4 !important; color: #166534 !important; border-left: 3px solid #16a34a !important; }
  .lt-root.lt-light .MuiSkeleton-root { background: rgba(0,0,0,0.07) !important; }
  .lt-root.lt-light .MuiTabs-indicator { background: #2d5016 !important; }
  .lt-root.lt-light .MuiTab-root.Mui-selected { color: #2d5016 !important; }

  /* ─── MUI overrides — DARK ─── */
  .lt-root.lt-dark .MuiCard-root { background: #1e293b !important; border: 1px solid rgba(56,197,134,0.15) !important; box-shadow: 0 4px 20px rgba(0,0,0,0.25) !important; color: #e2e8f0 !important; border-radius: 12px !important; }
  .lt-root.lt-dark .MuiTableContainer-root { background: #1e293b !important; }
  .lt-root.lt-dark .MuiTableHead-root .MuiTableCell-root { background: rgba(56,197,134,0.18) !important; color: #4ade80 !important; font-size: 0.68rem !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; font-family: 'Nunito', sans-serif !important; border-bottom: 1px solid rgba(56,197,134,0.2) !important; }
  .lt-root.lt-dark .MuiTableBody-root .MuiTableCell-root { border-bottom: 1px solid #334155 !important; color: #cbd5e1 !important; font-family: 'Nunito', sans-serif !important; background: #1e293b !important; }
  .lt-root.lt-dark .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root { background: rgba(56,197,134,0.07) !important; }
  .lt-root.lt-dark .MuiOutlinedInput-root { color: #e2e8f0 !important; background: #1e293b !important; }
  .lt-root.lt-dark .MuiOutlinedInput-notchedOutline { border-color: #334155 !important; }
  .lt-root.lt-dark .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color: #38c586 !important; }
  .lt-root.lt-dark .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { border-color: #38c586 !important; }
  .lt-root.lt-dark .MuiInputLabel-root { color: #64748b !important; }
  .lt-root.lt-dark .MuiInputLabel-root.Mui-focused { color: #38c586 !important; }
  .lt-root.lt-dark .MuiSelect-select { color: #e2e8f0 !important; }
  .lt-root.lt-dark .MuiMenu-paper, .lt-root.lt-dark .MuiPopover-paper { background: #1e293b !important; border: 1px solid #334155 !important; }
  .lt-root.lt-dark .MuiMenuItem-root { color: #e2e8f0 !important; }
  .lt-root.lt-dark .MuiMenuItem-root:hover { background: rgba(56,197,134,0.1) !important; }
  .lt-root.lt-dark .MuiDialog-paper { background: #1e293b !important; color: #e2e8f0 !important; border: 1px solid #334155 !important; border-radius: 14px !important; }
  .lt-root.lt-dark .MuiDialogTitle-root { color: #38c586 !important; font-family: 'Nunito', sans-serif !important; font-weight: 800 !important; letter-spacing: 0.05em !important; text-transform: uppercase !important; }
  .lt-root.lt-dark .MuiLinearProgress-root { background: rgba(56,197,134,0.12) !important; }
  .lt-root.lt-dark .MuiLinearProgress-bar { background: linear-gradient(90deg,#38c586,#4ade80) !important; }
  .lt-root.lt-dark .MuiDivider-root { border-color: #334155 !important; }
  .lt-root.lt-dark .MuiButton-contained { border-radius: 8px !important; font-family: 'Nunito', sans-serif !important; font-weight: 700 !important; }
  .lt-root.lt-dark .MuiButton-containedPrimary { background: #38c586 !important; color: #fff !important; }
  .lt-root.lt-dark .MuiButton-containedPrimary:hover { background: #2da86e !important; }
  .lt-root.lt-dark .MuiTypography-root { font-family: 'Nunito', sans-serif; }
  .lt-root.lt-dark .MuiPaper-root { background: #1e293b !important; }
  .lt-root.lt-dark .MuiAlert-standardError { background: rgba(220,38,38,0.12) !important; color: #fca5a5 !important; border-left: 3px solid #dc2626 !important; }
  .lt-root.lt-dark .MuiAlert-standardSuccess { background: rgba(56,197,134,0.12) !important; color: #4ade80 !important; border-left: 3px solid #38c586 !important; }
  .lt-root.lt-dark .MuiSkeleton-root { background: rgba(255,255,255,0.06) !important; }
  .lt-root.lt-dark .MuiTabs-indicator { background: #38c586 !important; }
  .lt-root.lt-dark .MuiTab-root.Mui-selected { color: #38c586 !important; }
  .lt-root.lt-dark .recharts-cartesian-grid line { stroke: rgba(56,197,134,0.1) !important; }
  .lt-root.lt-dark .recharts-text, .lt-root.lt-dark .recharts-cartesian-axis-tick-value { fill: #94a3b8 !important; }

  /* ─── MUI overrides — SUPER DARK ─── */
  .lt-root.lt-superdark .MuiPaper-root,
  .lt-root.lt-superdark .MuiCard-root,
  .lt-root.lt-superdark .MuiTableContainer-root,
  .lt-root.lt-superdark .MuiDialog-paper,
  .lt-root.lt-superdark .MuiMenu-paper,
  .lt-root.lt-superdark .MuiPopover-paper { background: #000000 !important; }
  .lt-root.lt-superdark .MuiCard-root { border-color: rgba(56,197,134,0.12) !important; color: #e2e8f0 !important; }
  .lt-root.lt-superdark .MuiTableHead-root .MuiTableCell-root { background: rgba(56,197,134,0.14) !important; }
  .lt-root.lt-superdark .MuiTableBody-root .MuiTableCell-root { background: #000000 !important; border-bottom-color: #111111 !important; color: #9ca3af !important; }
  .lt-root.lt-superdark .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root { background: #000000 !important; }
  .lt-root.lt-superdark .MuiOutlinedInput-root { background: #000000 !important; color: #e2e8f0 !important; }
  .lt-root.lt-superdark .MuiOutlinedInput-notchedOutline { border-color: #1a1a1a !important; }
  .lt-root.lt-superdark .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color: rgba(56,197,134,0.4) !important; }
  .lt-root.lt-superdark .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { border-color: #38c586 !important; }
  .lt-root.lt-superdark .MuiInputLabel-root { color: #4b5563 !important; }
  .lt-root.lt-superdark .MuiInputLabel-root.Mui-focused { color: #38c586 !important; }
  .lt-root.lt-superdark .MuiMenuItem-root { color: #e2e8f0 !important; background: #000000 !important; }
  .lt-root.lt-superdark .MuiMenuItem-root:hover { background: rgba(56,197,134,0.08) !important; }
  .lt-root.lt-superdark .MuiDialogTitle-root { color: #38c586 !important; }
  .lt-root.lt-superdark .MuiDivider-root { border-color: #111111 !important; }
  .lt-root.lt-superdark .MuiSkeleton-root { background: rgba(255,255,255,0.04) !important; }
  .lt-root.lt-superdark .MuiLinearProgress-root { background: rgba(56,197,134,0.08) !important; }
  .lt-root.lt-superdark .MuiLinearProgress-bar { background: linear-gradient(90deg,#38c586,#4ade80) !important; }
  .lt-root.lt-superdark .MuiButton-containedPrimary { background: #38c586 !important; color: #000 !important; }
  .lt-root.lt-superdark .MuiButton-containedPrimary:hover { background: #2da86e !important; }
  .lt-root.lt-superdark .MuiTabs-indicator { background: #38c586 !important; }
  .lt-root.lt-superdark .MuiTab-root.Mui-selected { color: #38c586 !important; }
  .lt-root.lt-superdark .recharts-cartesian-grid line { stroke: rgba(56,197,134,0.08) !important; }
  .lt-root.lt-superdark .recharts-text, .lt-root.lt-superdark .recharts-cartesian-axis-tick-value { fill: #4b5563 !important; }

  /* ─── MUI overrides — MONO (pure B&W, no color accents, placed last) ─── */
  .lt-root.lt-mono .MuiPaper-root,
  .lt-root.lt-mono .MuiCard-root,
  .lt-root.lt-mono .MuiTableContainer-root,
  .lt-root.lt-mono .MuiDialog-paper,
  .lt-root.lt-mono .MuiMenu-paper,
  .lt-root.lt-mono .MuiPopover-paper { background: #000000 !important; }
  .lt-root.lt-mono .MuiCard-root { border: 1px solid #1e1e1e !important; box-shadow: none !important; color: #e5e5e5 !important; border-radius: 12px !important; }
  .lt-root.lt-mono .MuiTableHead-root .MuiTableCell-root { background: #ffffff !important; color: #000000 !important; font-size: 0.68rem !important; font-weight: 800 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; border-bottom: none !important; }
  .lt-root.lt-mono .MuiTableBody-root .MuiTableCell-root { background: #000000 !important; border-bottom: 1px solid #141414 !important; color: #888888 !important; }
  .lt-root.lt-mono .MuiTableBody-root .MuiTableRow-root:hover .MuiTableCell-root { background: #0f0f0f !important; color: #cccccc !important; }
  .lt-root.lt-mono .MuiOutlinedInput-root { background: #000000 !important; color: #f5f5f5 !important; }
  .lt-root.lt-mono .MuiOutlinedInput-notchedOutline { border-color: #2a2a2a !important; }
  .lt-root.lt-mono .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color: #666666 !important; }
  .lt-root.lt-mono .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline { border-color: #ffffff !important; }
  .lt-root.lt-mono .MuiInputLabel-root { color: #444444 !important; }
  .lt-root.lt-mono .MuiInputLabel-root.Mui-focused { color: #ffffff !important; }
  .lt-root.lt-mono .MuiSelect-select { color: #f5f5f5 !important; }
  .lt-root.lt-mono .MuiMenuItem-root { color: #cccccc !important; background: #000000 !important; }
  .lt-root.lt-mono .MuiMenuItem-root:hover { background: #141414 !important; color: #ffffff !important; }
  .lt-root.lt-mono .MuiDialogTitle-root { color: #ffffff !important; letter-spacing: 0.08em !important; }
  .lt-root.lt-mono .MuiDivider-root { border-color: #1a1a1a !important; }
  .lt-root.lt-mono .MuiSkeleton-root { background: rgba(255,255,255,0.04) !important; }
  .lt-root.lt-mono .MuiLinearProgress-root { background: rgba(255,255,255,0.06) !important; }
  .lt-root.lt-mono .MuiLinearProgress-bar { background: #ffffff !important; }
  .lt-root.lt-mono .MuiButton-contained { border-radius: 8px !important; }
  .lt-root.lt-mono .MuiButton-containedPrimary { background: #ffffff !important; color: #000000 !important; }
  .lt-root.lt-mono .MuiButton-containedPrimary:hover { background: #dddddd !important; }
  .lt-root.lt-mono .MuiTypography-root { color: #cccccc !important; }
  .lt-root.lt-mono .MuiAlert-standardError { background: rgba(255,255,255,0.04) !important; color: #cccccc !important; border-left: 3px solid #ffffff !important; }
  .lt-root.lt-mono .MuiAlert-standardSuccess { background: rgba(255,255,255,0.04) !important; color: #cccccc !important; border-left: 3px solid #ffffff !important; }
  .lt-root.lt-mono .MuiTabs-indicator { background: #ffffff !important; }
  .lt-root.lt-mono .MuiTab-root.Mui-selected { color: #ffffff !important; }
  .lt-root.lt-mono .recharts-cartesian-grid line { stroke: rgba(255,255,255,0.06) !important; }
  .lt-root.lt-mono .recharts-text,
  .lt-root.lt-mono .recharts-cartesian-axis-tick-value { fill: #444444 !important; }
`;

// ─── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ teacher, dark, mono, onClose, onSaved }) {
    const [tab, setTab] = useState('profile');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);
    const fileRef = useRef(null);
    const [form, setForm] = useState({
        name: teacher?.name ?? '',
        username: teacher?.username ?? '',
        age: teacher?.age ?? '',
        gender: teacher?.gender ?? '',
        section: teacher?.section ?? '',
        contact: teacher?.contact ?? '',
        address: teacher?.address ?? '',
    });
    const [photo, setPhoto] = useState(teacher?.photo_base64 ?? '');
    const [pw, setPw] = useState({ current: '', next: '', confirm: '' });

    // mono class takes priority for modal theming
    const themeClass = mono ? 'lt-mono' : dark ? 'lt-dark' : 'lt-light';

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result);
        reader.readAsDataURL(file);
    };
    const saveProfile = async () => {
        setSaving(true); setMsg(null);
        try {
            await apiFetch(`/teachers/${teacher.id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...form, photo_base64: photo }),
            });
            setMsg({ type: 'ok', text: 'Profile updated successfully!' });
            onSaved({ ...teacher, ...form, photo_base64: photo });
        } catch (err) {
            setMsg({ type: 'err', text: err.message ?? 'Failed to update profile.' });
        } finally { setSaving(false); }
    };
    const savePassword = async () => {
        if (pw.next !== pw.confirm) { setMsg({ type: 'err', text: 'New passwords do not match.' }); return; }
        if (pw.next.length < 6) { setMsg({ type: 'err', text: 'Password must be at least 6 characters.' }); return; }
        setSaving(true); setMsg(null);
        try {
            await apiFetch(`/teachers/${teacher.id}/change-password`, {
                method: 'PUT',
                body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
            });
            setMsg({ type: 'ok', text: 'Password changed successfully!' });
            setPw({ current: '', next: '', confirm: '' });
        } catch (err) {
            setMsg({ type: 'err', text: err.message ?? 'Failed to change password.' });
        } finally { setSaving(false); }
    };
    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    return (<div className={`pm-overlay ${themeClass}`} onClick={handleBackdrop}>
      <div className={`pm-modal ${themeClass}`}>
        <div className="pm-header">
          <span className="pm-title">My Profile</span>
          <button className="pm-close" onClick={onClose}><CloseIcon fontSize="small"/></button>
        </div>
        <div className="pm-tabs">
          <button className={`pm-tab${tab === 'profile' ? ' pm-tab-active' : ''}`} onClick={() => { setTab('profile'); setMsg(null); }}>
            <PersonIcon sx={{ fontSize: 15 }}/> Profile
          </button>
          <button className={`pm-tab${tab === 'password' ? ' pm-tab-active' : ''}`} onClick={() => { setTab('password'); setMsg(null); }}>
            <LockIcon sx={{ fontSize: 15 }}/> Password
          </button>
        </div>

        {tab === 'profile' && (<>
            <div className="pm-photo-area">
              <div className="pm-photo-ring" onClick={() => fileRef.current?.click()}>
                {photo ? <img src={photo} alt="Profile"/> : <span>{form.name?.charAt(0)?.toUpperCase() ?? '?'}</span>}
                <div className="pm-photo-overlay">
                  <CameraAltIcon sx={{ fontSize: 22, color: mono ? '#000000' : '#ffffff' }}/>
                </div>
              </div>
              <span className="pm-photo-hint">Click to upload photo</span>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange}/>
            </div>
            <div className="pm-form">
              <div className="pm-row">
                <div className="pm-field"><label className="pm-label">Full Name</label><input className="pm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></div>
                <div className="pm-field"><label className="pm-label">Username</label><input className="pm-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}/></div>
              </div>
              <div className="pm-row">
                <div className="pm-field"><label className="pm-label">Age</label><input className="pm-input" type="number" min="18" max="99" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}/></div>
                <div className="pm-field">
                  <label className="pm-label">Gender</label>
                  <select className="pm-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="">— Select —</option>
                    <option>Male</option><option>Female</option><option>Prefer not to say</option>
                  </select>
                </div>
              </div>
              <div className="pm-row">
                <div className="pm-field"><label className="pm-label">Section / Class</label><input className="pm-input" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}/></div>
                <div className="pm-field"><label className="pm-label">Contact</label><input className="pm-input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}/></div>
              </div>
              <div className="pm-field"><label className="pm-label">Address</label><input className="pm-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}/></div>
              {msg && <div className={`pm-msg ${msg.type === 'ok' ? 'pm-msg-ok' : 'pm-msg-err'}`}>{msg.text}</div>}
              <div className="pm-footer">
                <button className="pm-btn pm-btn-cancel" onClick={onClose}>Cancel</button>
                <button className="pm-btn pm-btn-save" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </div>
          </>)}

        {tab === 'password' && (<div className="pm-form">
            <div className="pm-field"><label className="pm-label">Current Password</label><input className="pm-input" type="password" value={pw.current} onChange={e => setPw(p => ({ ...p, current: e.target.value }))} placeholder="Enter current password"/></div>
            <div className="pm-field"><label className="pm-label">New Password</label><input className="pm-input" type="password" value={pw.next} onChange={e => setPw(p => ({ ...p, next: e.target.value }))} placeholder="At least 6 characters"/><span className="pm-pw-hint">Must be at least 6 characters.</span></div>
            <div className="pm-field"><label className="pm-label">Confirm New Password</label><input className="pm-input" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Repeat new password"/></div>
            {msg && <div className={`pm-msg ${msg.type === 'ok' ? 'pm-msg-ok' : 'pm-msg-err'}`}>{msg.text}</div>}
            <div className="pm-footer">
              <button className="pm-btn pm-btn-cancel" onClick={onClose}>Cancel</button>
              <button className="pm-btn pm-btn-save" onClick={savePassword} disabled={saving}>{saving ? 'Updating…' : 'Change Password'}</button>
            </div>
          </div>)}
      </div>
    </div>);
}

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function Layout() {
    const { teacher, logout, setTeacher } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const [dark, setDark] = useState(() => localStorage.getItem('ct-theme') === 'dark');
    const [superDark, setSuperDark] = useState(() => localStorage.getItem('ct-superdark') === 'true');
    const [mono, setMono] = useState(() => localStorage.getItem('ct-mono') === 'true');
    const [font, setFont] = useState(() => localStorage.getItem('ct-font') ?? 'nunito');
    const [notifCount, setNotifCount] = useState(0);
    const [profileOpen, setProfileOpen] = useState(false);
    const [navCounts, setNavCounts] = useState({});

    useEffect(() => {
        const onStorage = () => setDark(localStorage.getItem('ct-theme') === 'dark');
        window.addEventListener('storage', onStorage);
        const id = setInterval(() => {
            const stored = localStorage.getItem('ct-theme') === 'dark';
            setDark(prev => prev !== stored ? stored : prev);
        }, 300);
        return () => { window.removeEventListener('storage', onStorage); clearInterval(id); };
    }, []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const fetchCount = () => {
            attendanceAPI.getAll(today)
                .then((r) => {
                    const records = r.data || [];
                    const attended = records.filter((x) => x.status !== 'Dropped Out').length;
                    const absences = records.filter((x) => x.status === 'Absent').length;
                    const dropouts = records.filter((x) => x.status === 'Dropped Out').length;
                    setNotifCount(attended);
                    setNavCounts({ attendance: attended, absences, dropouts, notifications: attended });
                })
                .catch(() => { });
        };
        fetchCount();
        const id = setInterval(fetchCount, 30_000);
        return () => clearInterval(id);
    }, []);

    const toggleDark = () => {
        const next = !dark;
        setDark(next);
        localStorage.setItem('ct-theme', next ? 'dark' : 'light');
        // turning off dark also turns off sub-modes
        if (!next) {
            if (superDark) { setSuperDark(false); localStorage.setItem('ct-superdark', 'false'); }
            if (mono)      { setMono(false);      localStorage.setItem('ct-mono', 'false'); }
        }
    };

    const toggleSuperDark = () => {
        const next = !superDark;
        setSuperDark(next);
        localStorage.setItem('ct-superdark', String(next));
        if (next) {
            setMono(false); localStorage.setItem('ct-mono', 'false'); // mutually exclusive
            if (!dark) { setDark(true); localStorage.setItem('ct-theme', 'dark'); }
        }
    };

    const toggleMono = () => {
        const next = !mono;
        setMono(next);
        localStorage.setItem('ct-mono', String(next));
        if (next) {
            setSuperDark(false); localStorage.setItem('ct-superdark', 'false'); // mutually exclusive
            if (!dark) { setDark(true); localStorage.setItem('ct-theme', 'dark'); }
        }
    };

    const toggleFont = () => {
        const next = font === 'nunito' ? 'dmsans' : 'nunito';
        setFont(next);
        localStorage.setItem('ct-font', next);
    };

    const colorMode = useMemo(() => ({ toggleColorMode: toggleDark, mode: dark ? 'dark' : 'light' }), [dark]);

    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: dark ? 'dark' : 'light',
            primary: { main: mono ? '#ffffff' : dark ? '#38c586' : '#2d5016' },
            background: {
                default: mono ? '#0a0a0a' : superDark ? '#000000' : dark ? '#0f172a' : '#f0f2f5',
                paper:   mono ? '#000000' : superDark ? '#000000' : dark ? '#1e293b' : '#ffffff',
            },
            text: { primary: dark ? '#e2e8f0' : '#111827', secondary: dark ? '#94a3b8' : '#6b7280' },
            divider: dark ? '#334155' : '#e5e7eb',
        },
        typography: { fontFamily: font === 'dmsans' ? "'DM Sans', sans-serif" : "'Nunito', sans-serif" },
        components: {
            MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
            MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: 'transparent' } } } },
        },
    }), [dark, superDark, mono, font]);

    const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    const currentPage = NAV.find(n => isActive(n.path))?.label ?? 'CHILDTrack';
    const shortDate = new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
    const getHour = () => new Date().getHours();
    const greeting = getHour() < 12 ? 'Good Morning' : getHour() < 18 ? 'Good Afternoon' : 'Good Evening';
    const logoSrc = dark ? logoDark : logoLight;

    const handleProfileSaved = (updated) => {
        setTeacher((prev) => {
            const merged = { ...prev, ...updated };
            localStorage.setItem('ct_teacher', JSON.stringify(merged));
            return merged;
        });
    };

    const rootClass = [
        'lt-root',
        dark ? 'lt-dark' : 'lt-light',
        superDark ? 'lt-superdark' : '',
        mono ? 'lt-mono' : '',
        font === 'dmsans' ? 'lt-font-dmsans' : 'lt-font-nunito',
    ].filter(Boolean).join(' ');

    return (<ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <style>{CSS}</style>
        <div className={rootClass}>

          {/* ═══ SIDEBAR ═══ */}
          <aside className={`lt-side${open ? '' : ' lt-mini'}`}>
            <div className="lt-brand">
              <div className="lt-logo-wrap">
                <img src={logoSrc} alt="CHILDTrack" className="lt-logo-img" onError={e => { e.target.style.display = 'none'; }}/>
              </div>
            </div>

            <nav className="lt-nav">
              <div className="lt-nav-label">Overview</div>
              {NAV.map(item => {
                const count = navCounts[item.countKey] ?? 0;
                const showBadge = count > 0 && !isActive(item.path);
                return (<button key={item.path} className={`lt-nav-btn${isActive(item.path) ? ' lt-active' : ''}`} onClick={() => navigate(item.path)} title={!open ? item.label : ''}>
                    <span className="lt-nav-icon">{item.icon}</span>
                    <span className="lt-nav-text">{item.label}</span>
                    {showBadge && (<span className="lt-notif-badge">{count > 99 ? '99+' : count}</span>)}
                  </button>);
              })}

              <div className="lt-sep"/>
              <div className="lt-nav-label">Preferences</div>

              <button className="lt-nav-btn" onClick={toggleDark} title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
                <span className="lt-nav-icon">
                  {dark ? <LightModeIcon fontSize="small"/> : <DarkModeIcon fontSize="small"/>}
                </span>
                <span className="lt-nav-text">{dark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              {dark && (<button className={`lt-nav-btn${superDark ? ' lt-active' : ''}`} onClick={toggleSuperDark} title={superDark ? 'Disable Super Dark' : 'Enable Super Dark (AMOLED black)'}>
                  <span className="lt-nav-icon"><BrightnessLowIcon fontSize="small"/></span>
                  <span className="lt-nav-text">Super Dark</span>
                  {superDark && <span className="lt-sd-dot"/>}
                </button>)}

              {dark && (<button className={`lt-nav-btn${mono ? ' lt-active' : ''}`} onClick={toggleMono} title={mono ? 'Disable Monochrome' : 'Enable Monochrome (black & white)'}>
                  <span className="lt-nav-icon"><ContrastIcon fontSize="small"/></span>
                  <span className="lt-nav-text">Monochrome</span>
                  {mono && <span className="lt-sd-dot"/>}
                </button>)}

              <button className="lt-nav-btn" onClick={toggleFont} title={font === 'nunito' ? 'Switch to DM Sans' : 'Switch to Nunito'}>
                <span className="lt-nav-icon"><TextFieldsIcon fontSize="small"/></span>
                <span className="lt-nav-text">
                  {font === 'nunito' ? 'Switch to DM Sans' : 'Switch to Nunito'}
                </span>
                <span className="lt-font-pill">
                  {font === 'nunito' ? 'Nunito' : 'DM Sans'}
                </span>
              </button>
            </nav>

            <div style={{ flex: 1 }}/>

            <div className="lt-footer">
              <div className="lt-sep"/>
              <button className="lt-logout-btn" onClick={logout} title="Log out">
                <span className="lt-nav-icon"><LogoutIcon fontSize="small"/></span>
                <span className="lt-logout-text">Log Out</span>
              </button>
            </div>
          </aside>

          {/* ═══ MAIN AREA ═══ */}
          <div className="lt-main">
            <div className="lt-topbar">
              <div className="lt-topbar-left">
                <button className="lt-menu-btn" onClick={() => setOpen(p => !p)} title={open ? 'Collapse sidebar' : 'Expand sidebar'}>
                  {open ? <ChevronLeftIcon fontSize="small"/> : <ChevronRightIcon fontSize="small"/>}
                </button>
                <span className="lt-page-title">{currentPage}</span>
              </div>

              <div className="lt-topbar-right">
                <NotificationBell dark={dark}/>

                {teacher && (<>
                    <div className="lt-avatar" title="Edit profile" onClick={() => setProfileOpen(true)}>
                      {teacher.photo_base64
                        ? <img src={teacher.photo_base64} alt={teacher.name}/>
                        : teacher.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div className="lt-greeting">{greeting}{teacher.name ? `, ${teacher.name}` : ''}</div>
                      {teacher.section && <div className="lt-greeting-sub">{teacher.section}</div>}
                    </div>
                  </>)}

                <div className="lt-date-chip">
                  <CalendarTodayIcon sx={{ fontSize: 12 }}/>
                  {shortDate}
                </div>
              </div>
            </div>

            <div className="lt-content">
              <Outlet />
            </div>
          </div>

        </div>

        {/* ═══ Profile Modal ═══ */}
        {profileOpen && teacher && (<ProfileModal teacher={teacher} dark={dark} mono={mono} onClose={() => setProfileOpen(false)} onSaved={handleProfileSaved}/>)}

      </ThemeProvider>
    </ColorModeContext.Provider>);
}