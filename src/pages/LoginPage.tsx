import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material';
import Visibility    from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';

import logoLight from '../assets/childtrack.png';
import logoDark  from '../assets/childtrack2.png';

/* ── Google Fonts ── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Nunito:wght@400;500;600;700;800&display=swap');`;

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('ct-theme') === 'dark');
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('ct-theme', next ? 'dark' : 'light');
  };
  return { dark, toggle };
}

export default function LoginPage() {
  const navigate        = useNavigate();
  const { login }       = useAuth();
  const { dark, toggle } = useDarkMode();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  /* ── Theme tokens ── */
  const primary       = dark ? '#38c586' : '#2d5016';
  const bg            = dark ? '#1e293b' : '#f0f2f5';
  const cardBg        = dark ? '#1e293b' : '#ffffff';
  const cardBorder    = dark ? 'rgba(56,197,134,0.15)' : '#e9ecef';
  const inputBg       = dark ? '#1e293b' : '#ffffff';
  const inputBorder   = dark ? '#334155' : '#d1d5db';
  const inputHover    = dark ? '#38c586' : '#2d5016';
  const textPrimary   = dark ? '#e2e8f0' : '#1e293b';
  const textSecondary = dark ? '#94a3b8' : '#6b7280';
  const subtextColor  = dark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.40)';
  const btnGrad       = dark
    ? 'linear-gradient(135deg,#38c586,#2da86e)'
    : 'linear-gradient(135deg,#2d5016,#4a7a25)';
  const btnGradHover  = dark
    ? 'linear-gradient(135deg,#2da86e,#1e8a5a)'
    : 'linear-gradient(135deg,#3a6420,#5a8a30)';
  const btnShadow     = dark
    ? '0 4px 14px rgba(56,197,134,0.3)'
    : '0 4px 14px rgba(45,80,22,0.25)';

  const logo = dark ? logoDark : logoLight;

  /* ── Field sx ── */
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Nunito", sans-serif',
      borderRadius: '10px',
      fontSize: 14,
      color: textPrimary,
      backgroundColor: inputBg,
      '& fieldset': { borderColor: inputBorder },
      '&:hover fieldset': { borderColor: inputHover },
      '&.Mui-focused fieldset': { borderColor: primary, borderWidth: '1.5px' },
      '& input:-webkit-autofill': {
        WebkitBoxShadow: `0 0 0 100px ${inputBg} inset !important`,
        WebkitTextFillColor: `${textPrimary} !important`,
      },
    },
    '& .MuiInputLabel-root': {
      fontFamily: '"Nunito", sans-serif',
      fontSize: 13.5,
      fontWeight: 600,
      color: textSecondary,
    },
    '& .MuiInputLabel-root.Mui-focused': { color: primary },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Username is required.'); return; }
    if (!password)        { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const res   = await authAPI.login(username.trim(), password);
      const token = res.data?.token || res.data?.access;
      const teacher = res.data?.teacher || res.data?.user || {
        id:       res.data?.id       ?? 0,
        name:     res.data?.name     ?? username.trim(),
        username: res.data?.username ?? username.trim(),
        section:  res.data?.section  ?? undefined,
      };
      if (token) {
        login(token, teacher); // ← updates context state + localStorage
      }
      navigate('/');
    } catch (err: any) {
      const d = err.response?.data;
      setError(
        d?.non_field_errors?.[0] ??
        d?.detail ??
        d?.error ??
        'Invalid username or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{FONTS}</style>
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        background: bg,
        fontFamily: '"Nunito", sans-serif',
        position: 'fixed',
        top: 0, left: 0,
      }}>

        {/* ══════════ LEFT PANEL ══════════ */}
        <Box sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: { md: '42%', lg: '45%' },
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: dark ? '#1e293b' : '#ffffff',
          borderRight: `1px solid ${cardBorder}`,
        }}>
          {/* Glow orbs */}
          {[
            { top: '-15%', right: '-10%', size: '55%', opacity: 0.18 },
            { bottom: '-10%', left: '-8%', size: '45%', opacity: 0.15 },
            { top: '50%',  left: '15%',  size: '25%', opacity: 0.10 },
          ].map((orb, i) => (
            <Box key={i} sx={{
              position: 'absolute',
              ...orb,
              width: orb.size,
              height: orb.size,
              borderRadius: '50%',
              background: `radial-gradient(circle,rgba(56,197,134,${orb.opacity}) 0%,transparent 70%)`,
              pointerEvents: 'none',
            }} />
          ))}

          {/* Logo */}
          <Box
            component="img"
            src={logo}
            alt="CHILDTrack"
            sx={{
              width: '58%', maxWidth: 280,
              objectFit: 'contain',
              position: 'relative', zIndex: 2,
              filter: dark
                ? 'drop-shadow(0 8px 40px rgba(56,197,134,0.25))'
                : 'drop-shadow(0 8px 40px rgba(45,80,22,0.18))',
            }}
          />

          {/* Brand text */}
          <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', mt: 4, px: 6 }}>
            <Typography sx={{
              fontFamily: '"Nunito", sans-serif',
              fontWeight: 900,
              fontSize: { md: '2.4rem', lg: '2.8rem' },
              color: dark ? '#4ade80' : '#2d5016',
              lineHeight: 1, letterSpacing: '0.5px',
            }}>
              CHILDTrack
            </Typography>
            <Typography sx={{
              fontFamily: '"Nunito", sans-serif',
              color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(45,80,22,0.55)',
              fontSize: '0.85rem', fontWeight: 600, mt: 1,
            }}>
              Child Attendance &amp; Monitoring System
            </Typography>

            <Box sx={{
              mt: 3, mx: 'auto',
              width: 48, height: 3, borderRadius: 2,
              background: dark
                ? 'linear-gradient(90deg,#38c586,#4ade80)'
                : 'linear-gradient(90deg,#2d5016,#4a7a25)',
            }} />

            <Typography sx={{
              mt: 2.5,
              fontFamily: '"Nunito", sans-serif',
              fontSize: '0.82rem',
              color: dark ? 'rgba(255,255,255,0.25)' : 'rgba(45,80,22,0.4)',
              fontWeight: 500,
              lineHeight: 1.7,
              maxWidth: 260,
              mx: 'auto',
            }}>
              Track attendance, monitor students, and keep guardians informed — all in one place.
            </Typography>
          </Box>

          {/* Bottom accent bar */}
          <Box sx={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, zIndex: 2,
            background: dark
              ? 'linear-gradient(90deg,transparent,#38c586 40%,#2da86e 60%,transparent)'
              : 'linear-gradient(90deg,transparent,#2d5016 40%,#4a7a25 60%,transparent)',
          }} />
        </Box>

        {/* ══════════ RIGHT PANEL ══════════ */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          px: { xs: 2, sm: 4 },
          py: 4,
          background: {
            xs: dark ? '#1e293b' : '#f0f2f5',
            md: dark ? '#1e293b' : '#ffffff',
          },
          position: 'relative',
        }}>

          {/* Theme toggle */}
          <Box
            component="button"
            onClick={toggle}
            sx={{
              position: 'absolute', top: 20, right: 20,
              width: 36, height: 36, borderRadius: '9px',
              border: `1.5px solid ${dark ? 'rgba(56,197,134,0.3)' : '#e5e7eb'}`,
              background: dark ? 'rgba(56,197,134,0.08)' : '#f9fafb',
              cursor: 'pointer', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', zIndex: 10,
              '&:hover': { background: dark ? 'rgba(56,197,134,0.16)' : '#f0f7e8' },
            }}
          >
            {dark ? '☀️' : '🌙'}
          </Box>

          {/* Card */}
          <Box sx={{
            width: '100%',
            maxWidth: 420,
            borderRadius: '16px',
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            boxShadow: dark
              ? '0 4px 20px rgba(0,0,0,0.35)'
              : '0 1px 3px rgba(0,0,0,0.06)',
            p: { xs: 3, sm: 4 },
          }}>

            {/* Icon badge */}
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px', mb: 2.5,
              background: dark
                ? 'linear-gradient(135deg,rgba(56,197,134,0.15),rgba(56,197,134,0.08))'
                : 'linear-gradient(135deg,rgba(45,80,22,0.1),rgba(45,80,22,0.05))',
              border: `1px solid ${dark ? 'rgba(56,197,134,0.25)' : 'rgba(45,80,22,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LockOutlinedIcon sx={{ color: primary, fontSize: 26 }} />
            </Box>

            {/* Header */}
            <Typography sx={{
              fontFamily: '"Nunito", sans-serif',
              fontWeight: 800,
              fontSize: 28,
              color: dark ? '#38c586' : '#2d5016',
              lineHeight: 1.1, mb: 0.5,
            }}>
              Welcome back
            </Typography>
            <Typography sx={{
              fontFamily: '"Nunito", sans-serif',
              fontSize: 13.5, color: textSecondary, fontWeight: 500, mb: 0.5,
            }}>
              Sign in to your teacher account to continue.
            </Typography>
            <Box sx={{
              width: 36, height: 3, borderRadius: 2, mb: 3,
              background: dark
                ? 'linear-gradient(90deg,#38c586,#4ade80)'
                : 'linear-gradient(90deg,#2d5016,#4a7a25)',
            }} />

            {/* Tab switcher */}
            <Box sx={{
              display: 'flex',
              background: dark ? '#1e293b' : '#ffffff',
              borderRadius: '10px', p: '3px', gap: '3px', mb: 3,
              border: `1px solid ${dark ? 'rgba(56,197,134,0.15)' : '#e5e7eb'}`,
            }}>
              {[
                { label: 'Sign In', active: true, to: null },
                { label: 'Register', active: false, to: '/register' },
              ].map(({ label, active, to }) => (
                <Box
                  key={label}
                  component={active ? 'div' : Link}
                  to={to ?? undefined}
                  sx={{
                    flex: 1, textAlign: 'center', py: '7px',
                    borderRadius: '7px',
                    fontFamily: '"Nunito", sans-serif',
                    fontWeight: 700, fontSize: '0.8rem',
                    cursor: active ? 'default' : 'pointer',
                    textDecoration: 'none', transition: 'all 0.18s',
                    background: active ? (dark ? '#1e293b' : '#ffffff') : 'transparent',
                    color: active ? (dark ? '#4ade80' : '#2d5016') : subtextColor,
                    boxShadow: active ? '0 1px 6px rgba(0,0,0,0.09)' : 'none',
                    display: 'block',
                  }}
                >
                  {label}
                </Box>
              ))}
            </Box>

            {/* Error */}
            {error && (
              <Alert severity="error" onClose={() => setError('')} sx={{
                mb: 2, borderRadius: '8px',
                fontFamily: '"Nunito", sans-serif', fontSize: 13,
                ...(dark && {
                  background: 'rgba(230,57,70,0.12)', color: '#fca5a5',
                  border: '1px solid rgba(230,57,70,0.25)',
                  '& .MuiAlert-icon': { color: '#fca5a5' },
                }),
              }}>
                {error}
              </Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Username *"
                fullWidth
                size="small"
                autoFocus
                value={username}
                onChange={e => setUsername(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlinedIcon sx={{ fontSize: 18, color: textSecondary }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Password *"
                type={showPw ? 'text' : 'password'}
                fullWidth
                size="small"
                value={password}
                onChange={e => setPassword(e.target.value)}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ fontSize: 18, color: textSecondary }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPw(p => !p)} sx={{ color: subtextColor }}>
                        {showPw
                          ? <VisibilityOff sx={{ fontSize: 16 }} />
                          : <Visibility sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 0.5, height: 44,
                  borderRadius: '10px',
                  fontFamily: '"Nunito", sans-serif',
                  fontWeight: 800, fontSize: 15,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  background: btnGrad,
                  boxShadow: btnShadow,
                  '&:hover': {
                    background: btnGradHover,
                    boxShadow: dark
                      ? '0 6px 20px rgba(56,197,134,0.4)'
                      : '0 6px 20px rgba(45,80,22,0.35)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'translateY(0)' },
                  '&.Mui-disabled': { opacity: 0.6 },
                  transition: 'all 0.2s',
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </Box>

            {/* Footer */}
            <Box sx={{
              mt: 3, pt: 2.5,
              borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : '#f0f0f0'}`,
              textAlign: 'center',
            }}>
              <Typography sx={{
                fontFamily: '"Nunito", sans-serif',
                fontSize: 13, color: textSecondary,
              }}>
                Don't have an account?{' '}
                <Box
                  component={Link}
                  to="/register"
                  sx={{
                    color: primary, fontWeight: 800,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Register here
                </Box>
              </Typography>
              <Typography sx={{
                fontFamily: '"Nunito", sans-serif',
                fontSize: 11, color: subtextColor, mt: 1,
                letterSpacing: '0.04em',
              }}>
                © {new Date().getFullYear()} CHILDTrack. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}