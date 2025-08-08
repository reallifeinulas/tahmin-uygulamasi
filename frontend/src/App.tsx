import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import PredictionPage from './pages/PredictionPage';
import UserProfile from './pages/UserProfile';

// Özel renk tipi tanımı
declare module '@mui/material/styles' {
  interface Palette {
    surface: Palette['primary'];
  }
  interface PaletteOptions {
    surface?: PaletteOptions['primary'];
  }
}

// Koyu Tema - Dengeli ve Göze Hoş Gelen Tonlar
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64b5f6', // Yumuşak mavi - daha dengeli
      light: '#90caf9',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#81c784', // Yumuşak yeşil - daha sakin
      light: '#a5d6a7',
      dark: '#66bb6a',
    },
    background: {
      default: '#121212', // Ana koyu background
      paper: '#1e1e1e', // Kartlar için temel koyu
    },
    surface: {
      main: '#2d2d2d', // Kartlar için orta koyu
      light: '#3d3d3d', // Hover durumları için
      dark: '#1a1a1a', // En koyu ton
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
    divider: '#4d4d4d',
    success: {
      main: '#81c784', // Yumuşak yeşil - göze daha hoş
    },
    warning: {
      main: '#ffb74d', // Yumuşak turuncu
    },
    error: {
      main: '#e57373', // Yumuşak kırmızı
    },
    info: {
      main: '#64b5f6', // Yumuşak mavi
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      color: '#ffffff',
    },
    h4: {
      fontWeight: 600,
      color: '#64b5f6', // Yumuşak mavi başlık
    },
    h6: {
      fontWeight: 500,
      color: '#ffffff',
    },
    body1: {
      color: '#ffffff',
    },
    body2: {
      color: '#b0b0b0',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          border: '1px solid #4d4d4d',
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: '#3d3d3d',
            boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          border: '1px solid #4d4d4d',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 25,
          textTransform: 'none',
          fontWeight: 600,
          '&.MuiButton-contained': {
            boxShadow: '0 3px 10px rgba(100,181,246,0.3)',
          },
          '&.MuiButton-outlined': {
            borderColor: '#4d4d4d',
            color: '#ffffff',
            '&:hover': {
              borderColor: '#64b5f6',
              backgroundColor: 'rgba(100,181,246,0.1)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#3d3d3d',
            '& fieldset': {
              borderColor: '#4d4d4d',
            },
            '&:hover fieldset': {
              borderColor: '#64b5f6',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#64b5f6',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#b0b0b0',
          },
          '& .MuiInputBase-input': {
            color: '#ffffff',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#3d3d3d',
          color: '#ffffff',
          border: '1px solid #4d4d4d',
          '&.MuiChip-colorPrimary': {
            backgroundColor: 'rgba(100,181,246,0.2)',
            color: '#64b5f6',
            border: '1px solid #64b5f6',
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: 'rgba(129,199,132,0.2)',
            color: '#81c784',
            border: '1px solid #81c784',
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: 'rgba(255,183,77,0.2)',
            color: '#ffb74d',
            border: '1px solid #ffb74d',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          border: '1px solid #4d4d4d',
          color: '#ffffff',
          borderRadius: 12,
          '&.MuiAlert-standardError': {
            backgroundColor: 'rgba(229,115,115,0.1)',
            borderColor: '#e57373',
            color: '#ffffff',
          },
          '&.MuiAlert-standardSuccess': {
            backgroundColor: 'rgba(129,199,132,0.1)',
            borderColor: '#81c784',
            color: '#ffffff',
          },
          '&.MuiAlert-standardWarning': {
            backgroundColor: 'rgba(255,183,77,0.1)',
            borderColor: '#ffb74d',
            color: '#ffffff',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: '#2d2d2d',
          border: '1px solid #4d4d4d',
          borderRadius: 12,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #4d4d4d',
          color: '#ffffff',
        },
        head: {
          backgroundColor: '#3d3d3d',
          color: '#ffffff',
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: '#b0b0b0',
          '&.Mui-selected': {
            color: '#64b5f6',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#64b5f6',
          height: 3,
          borderRadius: 2,
        },
      },
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white'
      }}>
        🔄 Yükleniyor...
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

// Guest Route Component (Login/Register için)
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: 'white'
      }}>
        🔄 Yükleniyor...
      </div>
    );
  }
  
  return user ? <Navigate to="/" /> : <>{children}</>;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ToastProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/prediction/:matchId" element={
              <ProtectedRoute>
                <PredictionPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/:username" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
          </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
