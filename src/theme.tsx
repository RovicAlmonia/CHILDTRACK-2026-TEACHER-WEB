import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#2d5016', light: '#4a7a25', dark: '#1a3009', contrastText: '#fff' },
    secondary:  { main: '#e63946', light: '#ff6b6b', dark: '#c62828', contrastText: '#fff' },
    warning:    { main: '#f59e0b', contrastText: '#fff' },
    info:       { main: '#3b82f6', contrastText: '#fff' },
    success:    { main: '#22c55e', contrastText: '#fff' },
    error:      { main: '#e63946', contrastText: '#fff' },
    background: { default: '#f8f5f0', paper: '#ffffff' },
    text:       { primary: '#111827', secondary: '#4b5563', disabled: '#9ca3af' },
    divider:    '#e5e0d8',
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 800 },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h4: { fontFamily: '"DM Sans", sans-serif',     fontWeight: 700 },
    h5: { fontFamily: '"DM Sans", sans-serif',     fontWeight: 700 },
    h6: { fontFamily: '"DM Sans", sans-serif',     fontWeight: 600 },
    button: { fontFamily: '"DM Sans", sans-serif', fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { background: '#f8f5f0', minHeight: '100vh' },
        '*': { scrollbarWidth: 'thin', scrollbarColor: '#2d5016 #e5e0d8' },
        '*::-webkit-scrollbar':       { width: 8 },
        '*::-webkit-scrollbar-track': { background: '#e5e0d8' },
        '*::-webkit-scrollbar-thumb': { background: '#2d5016', borderRadius: 8 },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: '#ffffff',
          borderBottom: '2px solid #e5e0d8',
          color: '#111827',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { background: '#ffffff', borderRight: '2px solid #e5e0d8' },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1.5px solid #e5e0d8',
          background: '#ffffff',
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': {
            boxShadow: '0 8px 32px rgba(45,80,22,0.10)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          letterSpacing: 0.3,
          '&.MuiButton-containedPrimary': {
            background: 'linear-gradient(135deg, #2d5016 0%, #4a7a25 100%)',
            boxShadow: '0 4px 14px rgba(45,80,22,0.28)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1a3009 0%, #2d5016 100%)',
              boxShadow: '0 6px 20px rgba(45,80,22,0.38)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: 'linear-gradient(135deg, #2d5016 0%, #4a7a25 100%)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { background: alpha('#2d5016', 0.04) },
          '&:last-child td': { border: 0 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: '1px solid #f0ebe3', padding: '12px 16px' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': { borderColor: '#2d5016' },
            '&.Mui-focused fieldset': { borderColor: '#2d5016' },
          },
          '& label.Mui-focused': { color: '#2d5016' },
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10, fontWeight: 500 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16, border: '1.5px solid #e5e0d8' } },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 4,
          transition: 'all 0.2s',
        },
      },
    },
  },
});