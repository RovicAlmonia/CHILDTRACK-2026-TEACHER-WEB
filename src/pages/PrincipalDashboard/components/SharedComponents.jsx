import { useState } from 'react';
import {
  Box, Typography, Chip, Avatar, Card, CardContent,
  CircularProgress, Alert, Button,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import SchoolIcon   from '@mui/icons-material/School';
import RefreshIcon  from '@mui/icons-material/Refresh';
import SyncIcon     from '@mui/icons-material/Sync';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

import { EMERALD, getStatusColor, getStatusLabel, fmtTime } from '../constants';
import childtrackDark  from '../../../assets/childtrack2.png';
import childtrackLight from '../../../assets/childtrack.png';

// ─────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────
export function ChildTrackLogo({ mode, style = {} }) {
  const src = mode === 'dark' ? childtrackDark : childtrackLight;
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ...style }}>
        <Avatar sx={{ bgcolor: EMERALD, width: 40, height: 40 }}>
          <SchoolIcon sx={{ fontSize: 22, color: '#fff' }} />
        </Avatar>
        <Box>
          <Typography sx={{ fontFamily: '"Nunito", sans-serif', fontWeight: 800, fontSize: '1rem', color: EMERALD, lineHeight: 1.1 }}>
            ChildTrack
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: 90, overflow: 'hidden', lineHeight: 0, ...style }}>
      <img
        src={src}
        alt="ChildTrack"
        style={{ width: '100%', height: 'auto', display: 'block', marginTop: '-30%', marginBottom: '40%' }}
        onError={() => setError(true)}
      />
    </Box>
  );
}

export function ChildTrackLogoCompact({ mode, height = 32 }) {
  const src = mode === 'dark' ? childtrackDark : childtrackLight;
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Avatar sx={{ bgcolor: EMERALD, width: height, height, mr: 1 }}>
        <SchoolIcon sx={{ fontSize: height * 0.55, color: '#fff' }} />
      </Avatar>
    );
  }

  return (
    <img
      src={src}
      alt="ChildTrack"
      height={height}
      style={{ objectFit: 'contain', display: 'block', marginRight: 6 }}
      onError={() => setError(true)}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return (
    <Chip
      label={label}
      size="small"
      icon={<FiberManualRecordIcon sx={{ fontSize: '8px !important', color: `${color} !important` }} />}
      sx={{
        fontSize: '0.72rem', fontWeight: 700, height: 22,
        bgcolor: alpha(color, 0.12), color,
        border: `1px solid ${alpha(color, 0.25)}`,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// INFO ROW
// ─────────────────────────────────────────────────────────────
export function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.8 }}>
      <Box sx={{ color: 'text.disabled', mt: 0.1, flexShrink: 0, fontSize: 16 }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{value || '—'}</Typography>
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color }) {
  return (
    <Card sx={{ borderRadius: '16px', height: '100%' }}>
      <CardContent sx={{ p: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(color, 0.12), width: 44, height: 44, flexShrink: 0 }}>
            <Box sx={{ color, display: 'flex', fontSize: 22 }}>{icon}</Box>
          </Avatar>
          <Box>
            <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1, fontFamily: '"Nunito", sans-serif' }}>
              {value ?? <span style={{ opacity: 0.3 }}>—</span>}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {label}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// LOADING / ERROR
// ─────────────────────────────────────────────────────────────
export function LoadingOverlay() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
      <CircularProgress sx={{ color: EMERALD }} />
    </Box>
  );
}

export function ErrorCard({ message, onRetry }) {
  return (
    <Alert
      severity="error"
      action={onRetry && <Button size="small" onClick={onRetry} startIcon={<RefreshIcon />}>Retry</Button>}
      sx={{ borderRadius: '12px' }}
    >
      {message}
    </Alert>
  );
}

// ─────────────────────────────────────────────────────────────
// LIVE INDICATOR
// ─────────────────────────────────────────────────────────────
export function LiveIndicator({ lastUpdated }) {
  if (!lastUpdated) return null;
  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.6 }}>
      <SyncIcon sx={{ fontSize: 12, color: EMERALD }} />
      <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontFamily: '"Nunito", sans-serif' }}>
        Live · {fmtTime(lastUpdated)}
      </Typography>
    </Box>
  );
}