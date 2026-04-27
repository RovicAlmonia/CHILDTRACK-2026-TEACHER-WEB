import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Grid, TextField, Button, Typography,
  Alert, CircularProgress, MenuItem, LinearProgress,
  InputAdornment, IconButton,
} from '@mui/material';
import Visibility    from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { authAPI } from '../api';

import logoLight from '../assets/childtrack.png';
import logoDark  from '../assets/childtrack2.png';

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('ct-theme') === 'dark');
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('ct-theme', next ? 'dark' : 'light');
  };
  return { dark, toggle };
}

/* ── Password strength ── */
function pwStrength(pw: string): { pct: number; label: string; color: 'error' | 'warning' | 'success' | 'inherit' } {
  if (!pw)           return { pct: 0,   label: '',          color: 'inherit' };
  if (pw.length < 6) return { pct: 20,  label: 'Too short', color: 'error'   };
  if (pw.length < 8) return { pct: 45,  label: 'Weak',      color: 'error'   };
  const hasNum = /[0-9]/.test(pw);
  const hasLet = /[a-zA-Z]/.test(pw);
  const hasSym = /[^a-zA-Z0-9]/.test(pw);
  if (pw.length >= 10 && hasNum && hasLet && hasSym) return { pct: 100, label: 'Strong', color: 'success' };
  if (hasNum && hasLet)                               return { pct: 70,  label: 'Medium', color: 'warning' };
  return { pct: 45, label: 'Weak', color: 'error' };
}

/* ── Section divider heading ── */
function SectionHead({ label, dark }: { label: string; dark: boolean }) {
  const divColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2.5, mb: 1.5 }}>
      <Box sx={{ flex: 1, height: '1px', background: divColor }} />
      <Typography sx={{
        fontFamily: '"Barlow Condensed", sans-serif',
        fontWeight: 700, fontSize: '0.68rem',
        letterSpacing: '1.3px', textTransform: 'uppercase',
        color: dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </Typography>
      <Box sx={{ flex: 1, height: '1px', background: divColor }} />
    </Box>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useDarkMode();
  const [form, setForm] = useState({
    name: '', username: '', password: '', confirm: '',
    age: '', gender: '', section: '', contact: '', address: '',
  });
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const pw = pwStrength(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm)  { setError('Passwords do not match.'); return; }
    if (form.password.length < 6)        { setError('Password must be at least 6 characters.'); return; }
    if (!form.name.trim())               { setError('Full name is required.'); return; }
    if (!form.username.trim())           { setError('Username is required.'); return; }
    setLoading(true);
    try {
      await authAPI.register({
        name:     form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        age:      form.age ? Number(form.age) : undefined,
        gender:   form.gender  || undefined,
        section:  form.section.trim()  || undefined,
        contact:  form.contact.trim()  || undefined,
        address:  form.address.trim()  || undefined,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (err: any) {
      const d = err.response?.data;
      if (typeof d === 'object' && d !== null) {
        setError(
          Object.entries(d)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n') || 'Registration failed.'
        );
      } else {
        setError(d?.error ?? 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Theme tokens ── */
  const primary      = dark ? '#38c586' : '#2d5016';
  const btnGrad      = dark ? 'linear-gradient(135deg,#38c586,#2da86e)' : 'linear-gradient(135deg,#2d5016,#4a7a25)';
  const btnGradHover = dark ? 'linear-gradient(135deg,#2da86e,#1e8a5a)' : 'linear-gradient(135deg,#3a6420,#5a8a30)';
  const btnShadow    = dark ? '0 4px 14px rgba(56,197,134,0.3)' : '0 4px 14px rgba(45,80,22,0.25)';
  const borderColor  = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const subtextColor = dark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.40)';
  const dividerColor = dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';

  const OverlayImage = dark ? logoDark : logoLight;

  /* ── Field style ── */
  const fieldSx = {
    mb: 0,
    '& .MuiOutlinedInput-root': {
      fontFamily: '"Nunito", sans-serif',
      borderRadius: '8px',
      fontSize: 13.5,
      color: dark ? '#e2e8f0' : '#1e293b',
      '& fieldset': { borderColor: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
      '&:hover fieldset': { borderColor: dark ? 'rgba(56,197,134,0.45)' : 'rgba(45,80,22,0.35)' },
      '&.Mui-focused fieldset': { borderColor: primary, borderWidth: '1.5px' },
    },
    '& .MuiInputLabel-root': {
      fontFamily: '"Nunito", sans-serif',
      fontSize: 13,
      fontWeight: 600,
      color: dark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)',
    },
    '& .MuiInputLabel-root.Mui-focused': { color: primary },
    '& .MuiInputBase-input': { color: dark ? '#e2e8f0' : '#1e293b' },
    '& .MuiSelect-icon': { color: subtextColor },
    '& .MuiSelect-select': { color: dark ? '#e2e8f0' : '#1e293b' },
    '& .MuiFormHelperText-root': { fontFamily: '"Nunito", sans-serif', fontSize: '0.7rem', mt: '3px' },
  };

  const selectMenuProps = {
    PaperProps: {
      sx: dark ? {
        background: '#1a3525',
        border: '1px solid rgba(56,197,134,0.2)',
        '& .MuiMenuItem-root': { fontFamily: '"Nunito", sans-serif', color: '#e2e8f0', fontSize: '0.87rem' },
        '& .MuiMenuItem-root:hover': { background: 'rgba(56,197,134,0.12)' },
        '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(56,197,134,0.18)', color: '#4ade80' },
      } : {
        '& .MuiMenuItem-root': { fontFamily: '"Nunito", sans-serif', fontSize: '0.87rem' },
      },
    },
  };

  return (
    <Grid container component="main" sx={{ 
  height: '100vh', 
  overflow: 'hidden',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100vw !important',
  maxWidth: '100vw !important',
  margin: '0 !important',
}}>
      {/* ══════════════════════════════════
          LEFT PANEL
      ══════════════════════════════════ */}
      <Grid
        item xs={false} md={5} lg={5.5} xl={6}
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          background: dark
            ? 'linear-gradient(145deg,#071a0f 0%,#0d2b18 50%,#071a0f 100%)'
            : 'linear-gradient(145deg,#edf5ec 0%,#d8eedd 50%,#edf5ec 100%)',
          borderRight: `1px solid ${borderColor}`,
        }}
      >
        {/* Glow orbs */}
        <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: '45%', height: '45%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,197,134,0.18) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />
        <Box sx={{ position: 'absolute', bottom: '-8%', left: '-5%',  width: '40%', height: '40%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(45,80,22,0.22) 0%,transparent 70%)',  pointerEvents: 'none', zIndex: 1 }} />
        <Box sx={{ position: 'absolute', top: '40%',   left: '10%',   width: '20%', height: '20%', borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,197,134,0.12) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 1 }} />

        {/* Logo */}
        <Box
          component="img"
          src={OverlayImage}
          alt="CHILDTrack"
          sx={{
            width: '60%',
            maxWidth: 300,
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            filter: dark
              ? 'drop-shadow(0 8px 40px rgba(56,197,134,0.22))'
              : 'drop-shadow(0 8px 40px rgba(45,80,22,0.16))',
          }}
        />

        {/* Branding */}
        <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center', mt: 3.5, px: 5 }}>
          <Typography sx={{
            fontFamily: '"Barlow Condensed", sans-serif',
            fontWeight: 800,
            fontSize: { md: '2.2rem', lg: '2.6rem' },
            color: dark ? '#4ade80' : '#2d5016',
            lineHeight: 1, letterSpacing: '0.5px',
          }}>
            CHILDTrack
          </Typography>
          <Typography sx={{
            fontFamily: '"Nunito", sans-serif',
            color: dark ? 'rgba(255,255,255,0.40)' : 'rgba(45,80,22,0.55)',
            fontSize: '0.86rem', fontWeight: 600, mt: 1,
          }}>
            Child Attendance &amp; Monitoring System
          </Typography>
        </Box>

        {/* Bottom accent */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, zIndex: 2,
          background: dark
            ? 'linear-gradient(90deg,transparent 0%,#38c586 40%,#2da86e 60%,transparent 100%)'
            : 'linear-gradient(90deg,transparent 0%,#2d5016 40%,#4a7a25 60%,transparent 100%)',
        }} />
      </Grid>

      {/* ══════════════════════════════════
          RIGHT PANEL
      ══════════════════════════════════ */}
      <Grid
        item xs={12} md={7} lg={6.5} xl={6}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          padding: { xs: 2, md: 3 },
          background: {
            xs: dark
              ? `linear-gradient(rgba(7,26,15,0.82),rgba(7,26,15,0.82)) center/cover no-repeat, url(${OverlayImage})`
              : `linear-gradient(rgba(255,255,255,0.84),rgba(255,255,255,0.84)) center/cover no-repeat, url(${OverlayImage})`,
            md: dark ? '#0b1f13' : '#ffffff',
          },
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 520,
            py: { xs: 3, md: 4 },
            px: { xs: 2.5, sm: 3.5, md: 4.5 },
            borderRadius: { xs: '16px', md: 0 },
            background: {
              xs: dark ? 'rgb(22,36,26)' : '#ffffff',
              md: 'transparent',
            },
            boxShadow: {
              xs: dark ? '0 8px 32px rgba(0,0,0,0.55)' : '0 8px 32px rgba(0,0,0,0.10)',
              md: 'none',
            },
            position: 'relative',
          }}
        >
          {/* Theme toggle */}
          <Box
            component="button"
            onClick={toggle}
            sx={{
              position: 'absolute', top: { xs: 12, md: -8 }, right: { xs: 12, md: 0 },
              width: 36, height: 36, borderRadius: '9px',
              border: `1.5px solid ${dark ? 'rgba(56,197,134,0.3)' : '#e2e8f0'}`,
              background: dark ? 'rgba(56,197,134,0.08)' : '#f4f7f0',
              cursor: 'pointer', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', zIndex: 10,
              '&:hover': { background: dark ? 'rgba(56,197,134,0.16)' : '#e8f5ea' },
            }}
          >
            {dark ? '☀️' : '🌙'}
          </Box>

          {/* Header */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontWeight: 800,
              fontSize: { xs: 24, md: 27 },
              color: dark ? '#ffffff' : '#1a2e1a',
              letterSpacing: '-0.01em',
              lineHeight: 1.2, mb: 0.5,
            }}>
              Create Account
            </Typography>
            <Typography sx={{
              fontFamily: '"Nunito", sans-serif',
              fontSize: 13, color: subtextColor, fontWeight: 500,
            }}>
              Fill in the details below to register as a teacher.
            </Typography>
            <Box sx={{
              mt: 1.5, width: 40, height: 3, borderRadius: 2,
              background: dark
                ? 'linear-gradient(90deg,#38c586,#4ade80)'
                : 'linear-gradient(90deg,#2d5016,#4a7a25)',
            }} />
          </Box>

          {/* Tab navigation */}
          <Box sx={{
            display: 'flex',
            background: dark ? 'rgba(15,23,42,0.6)' : '#f0f7f1',
            borderRadius: '10px', p: '3px', gap: '3px', mb: 2,
            border: `1px solid ${dark ? 'rgba(56,197,134,0.15)' : '#cce5d0'}`,
          }}>
            {[{ label: 'Sign In', to: '/login' }, { label: 'Register', to: null }].map(({ label, to }, i) => {
              const isActive = i === 1;
              return (
                <Box
                  key={label}
                  component={isActive ? 'div' : Link}
                  to={to ?? undefined}
                  sx={{
                    flex: 1, textAlign: 'center', py: '7px',
                    borderRadius: '7px',
                    fontFamily: '"Nunito", sans-serif',
                    fontWeight: 700, fontSize: '0.8rem',
                    cursor: isActive ? 'default' : 'pointer',
                    textDecoration: 'none', transition: 'all 0.18s',
                    background: isActive ? (dark ? '#1a3525' : '#ffffff') : 'transparent',
                    color: isActive ? (dark ? '#4ade80' : '#2d5016') : subtextColor,
                    boxShadow: isActive ? '0 1px 6px rgba(0,0,0,0.09)' : 'none',
                    display: 'block',
                  }}
                >
                  {label}
                </Box>
              );
            })}
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{
              mb: 1.5, borderRadius: '8px',
              fontFamily: '"Nunito", sans-serif', fontSize: 12.5,
              ...(dark && {
                background: 'rgba(230,57,70,0.12)', color: '#fca5a5',
                border: '1px solid rgba(230,57,70,0.25)',
                '& .MuiAlert-icon': { color: '#fca5a5' },
              }),
            }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{
              mb: 1.5, borderRadius: '8px',
              fontFamily: '"Nunito", sans-serif', fontSize: 12.5,
              ...(dark && {
                background: 'rgba(56,197,134,0.12)', color: '#bbf7d0',
                border: '1px solid rgba(56,197,134,0.25)',
                '& .MuiAlert-icon': { color: '#bbf7d0' },
              }),
            }}>
              Account created! Redirecting to login…
            </Alert>
          )}

          {/* ── FORM ── */}
          <Box component="form" onSubmit={handleSubmit}>

            {/* ── Account Credentials ── */}
            <SectionHead label="Account Credentials" dark={dark} />
            <Grid container spacing={1.5} sx={{ mb: 0 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name *" fullWidth size="small" autoFocus
                  value={form.name} onChange={set('name')}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Username *" fullWidth size="small"
                  value={form.username} onChange={set('username')}
                  helperText={<span style={{ color: subtextColor }}>Used to log in</span>}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Password *" type={showPw ? 'text' : 'password'}
                  fullWidth size="small"
                  value={form.password} onChange={set('password')}
                  sx={fieldSx}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPw(p => !p)} sx={{ color: subtextColor }}>
                          {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {form.password && (
                  <Box sx={{ mt: 0.6, px: 0.25 }}>
                    <LinearProgress
                      variant="determinate" value={pw.pct} color={pw.color as any}
                      sx={{
                        borderRadius: 4, height: 4,
                        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                        '& .MuiLinearProgress-bar': {
                          background: pw.color === 'success'
                            ? (dark ? 'linear-gradient(90deg,#38c586,#4ade80)' : 'linear-gradient(90deg,#2d5016,#4a7a25)')
                            : undefined,
                        },
                      }}
                    />
                    <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: '0.7rem', fontWeight: 700, color: subtextColor, mt: 0.4 }}>
                      {pw.label}
                    </Typography>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Confirm Password *" type={showCf ? 'text' : 'password'}
                  fullWidth size="small"
                  value={form.confirm} onChange={set('confirm')}
                  sx={fieldSx}
                  error={!!form.confirm && form.confirm !== form.password}
                  helperText={
                    form.confirm && form.confirm !== form.password
                      ? <span style={{ color: dark ? '#fca5a5' : '#e74c3c' }}>Passwords do not match</span>
                      : ''
                  }
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowCf(p => !p)} sx={{ color: subtextColor }}>
                          {showCf ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>

            {/* ── Personal Information ── */}
            <SectionHead label="Personal Information" dark={dark} />
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Age" fullWidth size="small" type="number"
                  value={form.age} onChange={set('age')}
                  inputProps={{ min: 18, max: 100 }}
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Gender" fullWidth size="small" select
                  value={form.gender} onChange={set('gender')}
                  sx={fieldSx}
                  SelectProps={{ MenuProps: selectMenuProps }}
                >
                  <MenuItem value="">Prefer not to say</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* ── School Information ── */}
            <SectionHead label="School Information" dark={dark} />
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  label="Section / Grade *" fullWidth size="small"
                  value={form.section} onChange={set('section')}
                  placeholder="e.g. Grade 6 – Section A"
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Contact Number" fullWidth size="small"
                  value={form.contact} onChange={set('contact')}
                  placeholder="e.g. 09123456789"
                  sx={fieldSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Address" fullWidth size="small"
                  value={form.address} onChange={set('address')}
                  placeholder="City, Province"
                  sx={fieldSx}
                />
              </Grid>
            </Grid>

            {/* Submit */}
            <Button
              type="submit" variant="contained" fullWidth disabled={loading}
              sx={{
                mt: 2.5, height: 44,
                borderRadius: '8px',
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800, fontSize: 15,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                background: btnGrad,
                boxShadow: btnShadow,
                '&:hover': {
                  background: btnGradHover,
                  boxShadow: dark ? '0 6px 20px rgba(56,197,134,0.4)' : '0 6px 20px rgba(45,80,22,0.35)',
                  transform: 'translateY(-1px)',
                },
                '&:active': { transform: 'translateY(0)' },
                '&.Mui-disabled': { opacity: 0.6 },
                transition: 'all 0.2s',
              }}
            >
              {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create Account'}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 2.5, pt: 2.5, borderTop: `1px solid ${dividerColor}`, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontSize: 12.5, color: subtextColor }}>
              Already have an account?{' '}
              <Box
                component={Link} to="/login"
                sx={{ color: primary, fontWeight: 800, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                Sign in
              </Box>
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: subtextColor, mt: 1, letterSpacing: '0.05em', fontFamily: '"Nunito", sans-serif' }}>
              © {new Date().getFullYear()} CHILDTrack. All rights reserved.
            </Typography>
          </Box>

        </Box>
      </Grid>
    </Grid>
  );
}