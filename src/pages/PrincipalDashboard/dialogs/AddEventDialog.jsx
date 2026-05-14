import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, TextField, MenuItem, Button, Typography, CircularProgress,
} from '@mui/material';
import { apiFetch } from '../api';
import { EVENT_TYPES } from '../constants';

const BLANK_EVENT = { title: '', description: '', event_type: 'School Event', scheduled_at: '', location: '' };

/**
 * AddEventDialog
 * Props:
 *   open, onClose, onSaved
 */
export default function AddEventDialog({ open, onClose, onSaved }) {
  const [form,   setForm]   = useState(BLANK_EVENT);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  useEffect(() => {
    if (open) { setForm(BLANK_EVENT); setErr(''); setSaving(false); }
  }, [open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title || !form.scheduled_at) { setErr('Title and date/time are required.'); return; }
    setSaving(true);
    setErr('');
    try {
      const created = await apiFetch('/events', { method: 'POST', body: JSON.stringify(form) });
      onSaved(created);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableRestoreFocus
      slotProps={{ paper: { sx: { borderRadius: '20px' } } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem', pb: 1 }}>📅 Post School Event</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          <TextField
            label="Title" value={form.title} size="small" fullWidth
            onChange={e => set('title', e.target.value)} />
          <TextField
            label="Description" value={form.description} size="small" fullWidth
            multiline rows={3} onChange={e => set('description', e.target.value)} />
          <TextField
            select label="Event Type" value={form.event_type} size="small" fullWidth
            onChange={e => set('event_type', e.target.value)}>
            {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField
            label="Date & Time" type="datetime-local" value={form.scheduled_at} size="small" fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={e => set('scheduled_at', e.target.value)} />
          <TextField
            label="Location (optional)" value={form.location} size="small" fullWidth
            onChange={e => set('location', e.target.value)} />
          {err && <Typography color="error" fontSize="0.8rem">{err}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={save} disabled={saving} variant="contained" sx={{ borderRadius: '10px', fontWeight: 700 }}>
          {saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Post Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}