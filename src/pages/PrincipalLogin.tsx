// src/pages/PrincipalLogin.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ChildTrack — Principal Login Page (Redesigned)
// Uses ChildTrackLogo from SharedComponents
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField,
  Button, InputAdornment, IconButton, Alert, Chip, Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon            from '@mui/icons-material/Person';
import LockIcon              from '@mui/icons-material/Lock';
import VisibilityIcon        from '@mui/icons-material/Visibility';
import VisibilityOffIcon     from '@mui/icons-material/VisibilityOff';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';

// ✅ Correct imports for PrincipalLogin.tsx
// Location: pages/PrincipalDashboard/PrincipalLogin.tsx
// ✅ Correct imports for src/pages/PrincipalLogin.tsx

import { ChildTrackLogo } from './PrincipalDashboard/components/SharedComponents';
import { EMERALD } from './PrincipalDashboard/constants';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

async function loginPrincipal(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/principal/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Login failed.');
  return data; // { token, principal }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PrincipalLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Hardcode dark for login since dashboard defaults to dark too
  const mode = 'dark';

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { token, principal } = await loginPrincipal(username.trim(), password);
      localStorage.setItem('principalToken', token);
      localStorage.setItem('principalInfo',  JSON.stringify(principal));
      navigate('/principal');
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#1e293b',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
    }}>

      

      {/* ── Left panel — branding (hidden on mobile) ── */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '42%',
        minHeight: '100vh',
        px: 6, py: 5,
        position: 'relative', zIndex: 1,
        borderRight: `1px solid ${alpha('#fff', 0.05)}`,
      }}>
        {/* Logo */}
        <Box sx={{ width: 200 }}>
          <ChildTrackLogo mode={mode} />
        </Box>

        {/* Center copy */}
        <Box>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.6, borderRadius: '8px', mb: 3,
            bgcolor: alpha(EMERALD, 0.1),
            border: `1px solid ${alpha(EMERALD, 0.2)}`,
          }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 14, color: EMERALD }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: EMERALD, letterSpacing: 1, textTransform: 'uppercase' }}>
              Principal Portal
            </Typography>
          </Box>

          <Typography sx={{
            fontFamily: '"Nunito", sans-serif',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 3vw, 2.8rem)',
            color: '#fff',
            lineHeight: 1.1,
            mb: 2,
          }}>
            Your school,<br />
            <Box component="span" sx={{ color: EMERALD }}>at a glance.</Box>
          </Typography>

          <Typography sx={{
            fontSize: '0.9rem',
            color: alpha('#fff', 0.45),
            lineHeight: 1.7,
            maxWidth: 340,
          }}>
            Monitor attendance, track absences, manage teachers,
            and oversee school events — all from one place.
          </Typography>

          {/* Feature pills */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4 }}>
            {['Live Attendance', 'Teacher Overview', 'Event Management', 'SF2 Reports'].map(f => (
              <Chip key={f} label={f} size="small" sx={{
                fontSize: '0.7rem', fontWeight: 700,
                bgcolor: alpha('#ffffff', 0.05),
                color: alpha('#fff', 0.5),
                border: `1px solid ${alpha('#fff', 0.08)}`,
                borderRadius: '8px',
              }} />
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Typography sx={{ fontSize: '0.68rem', color: alpha('#fff', 0.2) }}>
          ChildTrack © {new Date().getFullYear()} · USTP-CITC
        </Typography>
      </Box>

      {/* ── Right panel — login form ── */}
<Box sx={{
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  px: { xs: 3, sm: 5, md: 6 },   // ← was xs:2, sm:4
  py: 4,
  position: 'relative', zIndex: 1,
}}>
        <Box sx={{ width: '100%', maxWidth: 400,   mx: { xs: 1, sm: 'auto' }, }}>  

          {/* Mobile-only logo */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 4, width: 160 }}>
            <ChildTrackLogo mode={mode} />
          </Box>

          {/* Form header */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{
              fontFamily: '"Nunito", sans-serif',
              fontWeight: 900, fontSize: '1.6rem',
              color: '#fff', lineHeight: 1.2, mb: 0.5,
            }}>
              Welcome back
            </Typography>
            <Typography sx={{ fontSize: '0.83rem', color: alpha('#fff', 0.4) }}>
              Sign in to the administrator dashboard
            </Typography>
          </Box>

          {/* Error */}
          {error && (
            <Alert severity="error" sx={{
              mb: 3, borderRadius: '12px', fontSize: '0.82rem',
              bgcolor: alpha('#ef4444', 0.1),
              border: `1px solid ${alpha('#ef4444', 0.2)}`,
              color: '#fca5a5',
              '& .MuiAlert-icon': { color: '#f87171' },
            }}>
              {error}
            </Alert>
          )}

          {/* Card */}
          <Card sx={{
            borderRadius: '20px',
            bgcolor: alpha('#fff', 0.03),
            border: `1px solid ${alpha('#fff', 0.08)}`,
            backdropFilter: 'blur(12px)',
          }}>
            <CardContent sx={{ p: '28px !important' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Username */}
                <Box>
                  <Typography sx={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: alpha('#fff', 0.5), textTransform: 'uppercase',
                    letterSpacing: 0.8, mb: 0.8,
                  }}>
                    Username
                  </Typography>
                  <TextField
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your username"
                    size="small"
                    fullWidth
                    autoFocus
                    autoComplete="username"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ fontSize: 17, color: alpha('#fff', 0.25) }} />
                          </InputAdornment>
                        ),
                         sx: { pl: 0.5 },   // ← add this
                      },
                    }}
                    sx={{
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: alpha('#fff', 0.04),
    color: '#fff',
    fontSize: '0.88rem',
    '& fieldset': { borderColor: alpha('#fff', 0.1) },
    '&:hover fieldset': { borderColor: alpha(EMERALD, 0.4) },
    '&.Mui-focused fieldset': { borderColor: EMERALD, borderWidth: 1.5 },
  },
  '& .MuiOutlinedInput-input': {   // ← targets the actual <input> element
    paddingLeft: '10px',
  },
  '& input::placeholder': { color: alpha('#fff', 0.2), opacity: 1 },
}}
                    />
                </Box>

                {/* Password */}
                <Box>
                  <Typography sx={{
                    fontSize: '0.72rem', fontWeight: 700,
                    color: alpha('#fff', 0.5), textTransform: 'uppercase',
                    letterSpacing: 0.8, mb: 0.8,
                  }}>
                    Password
                  </Typography>
                  <TextField
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter your password"
                    size="small"
                    fullWidth
                    autoComplete="current-password"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ fontSize: 17, color: alpha('#fff', 0.25) }} />
                          </InputAdornment>
                        ),
                         sx: { pl: 0.5 },   // ← add this
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              size="small"
                              onClick={() => setShowPass(p => !p)}
                              edge="end"
                              sx={{ color: alpha('#fff', 0.25), '&:hover': { color: alpha('#fff', 0.6) } }}
                            >
                              {showPass
                                ? <VisibilityOffIcon sx={{ fontSize: 17 }} />
                                : <VisibilityIcon   sx={{ fontSize: 17 }} />
                              }
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    bgcolor: alpha('#fff', 0.04),
    color: '#fff',
    fontSize: '0.88rem',
    '& fieldset': { borderColor: alpha('#fff', 0.1) },
    '&:hover fieldset': { borderColor: alpha(EMERALD, 0.4) },
    '&.Mui-focused fieldset': { borderColor: EMERALD, borderWidth: 1.5 },
  },
  '& .MuiOutlinedInput-input': {   // ← targets the actual <input> element
    paddingLeft: '10px',
  },
  '& input::placeholder': { color: alpha('#fff', 0.2), opacity: 1 },
}}
                  />
                </Box>

                {/* Sign in button */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleLogin}
                  disabled={loading}
                  endIcon={!loading && <ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    mt: 0.5,
                    borderRadius: '12px',
                    fontFamily: '"Nunito", sans-serif',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    py: 1.25,
                    bgcolor: EMERALD,
                    color: '#fff',
                    textTransform: 'none',
                    boxShadow: `0 4px 24px ${alpha(EMERALD, 0.4)}`,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: '#2eac72',
                      boxShadow: `0 6px 28px ${alpha(EMERALD, 0.55)}`,
                      transform: 'translateY(-1px)',
                    },
                    '&:active': { transform: 'translateY(0)' },
                    '&.Mui-disabled': {
                      bgcolor: alpha(EMERALD, 0.3),
                      color: alpha('#fff', 0.5),
                    },
                  }}
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Divider + teacher link */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Divider sx={{ flex: 1, borderColor: alpha('#fff', 0.07) }} />
            <Typography sx={{ fontSize: '0.68rem', color: alpha('#fff', 0.2), whiteSpace: 'nowrap' }}>
              not an admin?
            </Typography>
            <Divider sx={{ flex: 1, borderColor: alpha('#fff', 0.07) }} />
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Chip
              label="Go to Teacher Login →"
              size="small"
              clickable
              onClick={() => navigate('/login')}
              sx={{
                fontSize: '0.7rem', fontWeight: 700, height: 26,
                bgcolor: 'transparent',
                border: `1px solid ${alpha('#fff', 0.1)}`,
                color: alpha('#fff', 0.35),
                borderRadius: '8px',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: alpha(EMERALD, 0.5),
                  color: EMERALD,
                  bgcolor: alpha(EMERALD, 0.06),
                },
              }}
            />
          </Box>

          {/* Mobile footer */}
          <Typography sx={{ display: { md: 'none' }, textAlign: 'center', fontSize: '0.68rem', color: alpha('#fff', 0.15), mt: 4 }}>
            ChildTrack © {new Date().getFullYear()} · USTP-CITC
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}