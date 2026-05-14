import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Button, Stack,
  TextField, InputAdornment, IconButton, Alert, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import PersonIcon       from '@mui/icons-material/Person';
import LockIcon         from '@mui/icons-material/Lock';
import CameraAltIcon    from '@mui/icons-material/CameraAlt';
import SaveIcon         from '@mui/icons-material/Save';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useApi }                  from '../hooks/useApi';
import { apiFetch }                from '../api';
import { LoadingOverlay, ErrorCard } from '../components/SharedComponents';
import { EMERALD, initials } from '../constants';

/**
 * SettingsPage
 * Props:
 *   onProfileUpdated(principal) — called after a successful profile save
 *   showSnack(msg, severity)    — from root app
 */
export default function SettingsPage({ onProfileUpdated, showSnack }) {
  const { data: profile, loading, error, refetch } = useApi('/profile');

  const [name,          setName]          = useState('');
  const [username,      setUsername]      = useState('');
  const [photo,         setPhoto]         = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw,  setSavingPw]  = useState(false);
  const [pwErr,     setPwErr]     = useState('');

  // Sync form fields and sidebar avatar on initial profile load
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setUsername(profile.username ?? '');
      setPhoto(profile.photo ?? null);
      // ✅ Sync sidebar avatar on initial load
      onProfileUpdated?.({ name: profile.name, photo: profile.photo ?? null });
    }
  }, [profile]);

  // ✅ Live-preview photo changes in the sidebar before saving
  useEffect(() => {
    onProfileUpdated?.({ name: name || profile?.name, photo });
  }, [photo]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showSnack('Photo must be under 2 MB.', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    if (!name.trim())     { showSnack('Name is required.', 'error'); return; }
    if (!username.trim()) { showSnack('Username is required.', 'error'); return; }
    setSavingProfile(true);
    try {
      const result = await apiFetch('/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), username: username.trim(), photo }),
      });
      showSnack('Profile updated!');
      onProfileUpdated?.(result.principal);
      refetch();
    } catch (e) {
      showSnack(e.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPwErr('');
    if (!currentPw || !newPw || !confirmPw) { setPwErr('All fields are required.'); return; }
    if (newPw.length < 6) { setPwErr('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwErr('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await apiFetch('/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      showSnack('Password changed!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      setPwErr(e.message);
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) return <LoadingOverlay />;
  if (error)   return <ErrorCard message={error} onRetry={refetch} />;

  const displayName = profile?.name ?? 'Principal Admin';

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto' }}>
      <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1.6rem', color: 'text.primary', mb: 3 }}>
        Account Settings
      </Typography>

      {/* ── Profile Card ── */}
      <Card sx={{ borderRadius: '20px', mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2.5 }}>
            Profile Information
          </Typography>

          {/* Avatar upload */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 3 }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Avatar
                src={photo ?? undefined}
                sx={{
                  width: 80, height: 80,
                  bgcolor: alpha(EMERALD, 0.15), color: EMERALD,
                  fontWeight: 800, fontSize: '1.6rem', fontFamily: '"Nunito", sans-serif',
                  border: `3px solid ${alpha(EMERALD, 0.3)}`, cursor: 'pointer',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {!photo && initials(name || displayName)}
              </Avatar>
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  bgcolor: EMERALD, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid',
                  borderColor: t => t.palette.background.paper,
                  transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.1)' },
                }}
              >
                <CameraAltIcon sx={{ fontSize: 13, color: '#fff' }} />
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload profile photo"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{displayName}</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mb: 1 }}>
                Click the avatar to change your profile photo
              </Typography>
              {photo && (
                <Button size="small" onClick={() => setPhoto(null)}
                  sx={{ fontSize: '0.72rem', color: '#e63946', p: '2px 8px', minWidth: 0, borderRadius: '8px',
                    '&:hover': { bgcolor: alpha('#e63946', 0.08) } }}>
                  Remove photo
                </Button>
              )}
            </Box>
          </Box>

          <Stack spacing={2}>
            <TextField
              label="Full Name" value={name} size="small" fullWidth
              onChange={e => setName(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="Username" value={username} size="small" fullWidth
              onChange={e => setUsername(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.9rem', color: 'text.disabled', fontWeight: 700 }}>@</Typography></InputAdornment> } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Stack>

          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={saveProfile} disabled={savingProfile}
              startIcon={savingProfile ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <SaveIcon />}
              sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 3 }}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* ── Change Password Card ── */}
      <Card sx={{ borderRadius: '20px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
            <LockIcon sx={{ fontSize: 16, color: EMERALD }} />
            <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1 }}>
              Change Password
            </Typography>
          </Box>

          <Stack spacing={2}>
            <TextField
              label="Current Password" type={showCurPw ? 'text' : 'password'}
              value={currentPw} size="small" fullWidth
              onChange={e => setCurrentPw(e.target.value)}
              slotProps={{ input: { endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowCurPw(v => !v)} edge="end">
                    {showCurPw ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </InputAdornment>
              ) } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="New Password" type={showNewPw ? 'text' : 'password'}
              value={newPw} size="small" fullWidth helperText="Minimum 6 characters"
              onChange={e => setNewPw(e.target.value)}
              slotProps={{ input: { endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowNewPw(v => !v)} edge="end">
                    {showNewPw ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </InputAdornment>
              ) } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            <TextField
              label="Confirm New Password" type="password"
              value={confirmPw} size="small" fullWidth
              onChange={e => setConfirmPw(e.target.value)}
              error={!!confirmPw && confirmPw !== newPw}
              helperText={!!confirmPw && confirmPw !== newPw ? 'Passwords do not match' : ''}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
            {pwErr && <Alert severity="error" sx={{ borderRadius: '10px', py: 0.5, fontSize: '0.8rem' }}>{pwErr}</Alert>}
          </Stack>

          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" onClick={savePassword} disabled={savingPw}
              startIcon={savingPw ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <LockIcon />}
              sx={{ borderRadius: '12px', fontWeight: 700, textTransform: 'none', px: 3 }}>
              {savingPw ? 'Updating…' : 'Update Password'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}