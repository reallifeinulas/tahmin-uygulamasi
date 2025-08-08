import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material';
import { 
  AccountCircle, 
  SportsSoccer, 
  Logout, 
  Menu as MenuIcon,
  Dashboard,
  Person,
  AdminPanelSettings
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
    handleDrawerClose();
  };

  const handleProfile = () => {
    if (user?.name) {
      navigate(`/profile/${user.name}`);
    }
    handleMenuClose();
    handleDrawerClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleDrawerClose();
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <SportsSoccer sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            Tahmin Uygulaması
          </Typography>
          
          {user && !isMobile ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`${user.score} Puan`} 
                color="warning" 
                variant="outlined"
                sx={{ color: 'white', borderColor: 'white' }}
              />
              
              {user.isAdmin && (
                <Chip 
                  label="Admin" 
                  color="error" 
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              )}
              
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user.name.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleProfile}>
                  <AccountCircle sx={{ mr: 1 }} />
                  Profil
                </MenuItem>
                {user.isAdmin && (
                  <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
                    <SportsSoccer sx={{ mr: 1 }} />
                    Admin Panel
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Çıkış Yap
                </MenuItem>
              </Menu>
            </Box>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Giriş Yap
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Kayıt Ol
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            📱 Menü
          </Typography>
          <Divider />
        </Box>

        <List>
          {/* Dashboard */}
          <ListItem disablePadding>
            <ListItemButton onClick={() => handleNavigate('/')}>
              <ListItemIcon>
                <Dashboard />
              </ListItemIcon>
              <ListItemText primary="Ana Sayfa" />
            </ListItemButton>
          </ListItem>

          {/* Profile */}
          {user && (
            <ListItem disablePadding>
              <ListItemButton onClick={handleProfile}>
                <ListItemIcon>
                  <Person />
                </ListItemIcon>
                <ListItemText primary="Profil" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Admin Panel */}
          {user?.isAdmin && (
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleNavigate('/admin')}>
                <ListItemIcon>
                  <AdminPanelSettings />
                </ListItemIcon>
                <ListItemText primary="Admin Panel" />
              </ListItemButton>
            </ListItem>
          )}

          <Divider sx={{ my: 2 }} />

          {/* User Info */}
          {user ? (
            <>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  👤 {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  🏆 {user.score} Puan
                </Typography>
                {user.isAdmin && (
                  <Chip 
                    label="Admin" 
                    color="error" 
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout />
                  </ListItemIcon>
                  <ListItemText primary="Çıkış Yap" />
                </ListItemButton>
              </ListItem>
            </>
          ) : (
            <>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigate('/login')}>
                  <ListItemIcon>
                    <AccountCircle />
                  </ListItemIcon>
                  <ListItemText primary="Giriş Yap" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleNavigate('/register')}>
                  <ListItemIcon>
                    <Person />
                  </ListItemIcon>
                  <ListItemText primary="Kayıt Ol" />
                </ListItemButton>
              </ListItem>
            </>
          )}
        </List>
      </Drawer>
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: isMobile ? 2 : 4, 
          mb: isMobile ? 2 : 4,
          px: isMobile ? 1 : 3
        }}
      >
        {children}
      </Container>
    </Box>
  );
};

export default Layout; 