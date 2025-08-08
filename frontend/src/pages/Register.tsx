import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Paper,
  Avatar
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { RegisterFormData } from '../types';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState<string>('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Comprehensive validation
    const validationErrors = [];

    // Required fields
    if (!formData.name || formData.name.trim().length === 0) {
      validationErrors.push('Kullanıcı adı gerekli');
    }
    if (!formData.email || formData.email.trim().length === 0) {
      validationErrors.push('E-posta adresi gerekli');
    }
    if (!formData.password || formData.password.length === 0) {
      validationErrors.push('Şifre gerekli');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email.trim())) {
      validationErrors.push('Geçerli bir e-posta adresi girin');
    }

    // Length validation
    if (formData.name && (formData.name.trim().length < 3 || formData.name.trim().length > 50)) {
      validationErrors.push('Kullanıcı adı 3-50 karakter arasında olmalıdır');
    }
    if (formData.email && formData.email.trim().length > 100) {
      validationErrors.push('E-posta adresi 100 karakterden uzun olamaz');
    }
    if (formData.password && formData.password.length < 6) {
      validationErrors.push('Şifre en az 6 karakter olmalıdır');
    }
    if (formData.password && formData.password.length > 128) {
      validationErrors.push('Şifre 128 karakterden uzun olamaz');
    }

    // Username format validation
    const usernameRegex = /^[a-zA-Z0-9_üğıçöşıİĞÜÇÖŞ]+$/;
    if (formData.name && !usernameRegex.test(formData.name.trim())) {
      validationErrors.push('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir');
    }

    // Password strength validation
    if (formData.password) {
      if (!/[a-zA-Z]/.test(formData.password)) {
        validationErrors.push('Şifre en az bir harf içermelidir');
      }
      if (!/[0-9]/.test(formData.password)) {
        validationErrors.push('Şifre en az bir rakam içermelidir');
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }

    try {
      await register(formData.email, formData.password, formData.name);
      navigate('/');
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.message || 'Kayıt oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#121212',
        backgroundImage: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}
    >
      <Paper elevation={24} sx={{ p: 4, maxWidth: 400, width: '100%', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main', width: 56, height: 56 }}>
            <PersonAdd />
          </Avatar>
          <Typography component="h1" variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>
            Kayıt Ol
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Hesabınızı oluşturun ve tahmin yapmaya başlayın!
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Box component="pre" sx={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                {error}
              </Box>
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Ad Soyad"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="E-posta Adresi"
            name="email"
            autoComplete="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Şifre (En az 6 karakter)"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1.1rem', backgroundColor: 'secondary.main' }}
            disabled={loading}
          >
            {loading ? 'Kayıt Oluşturuluyor...' : 'Kayıt Ol'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Zaten hesabınız var mı?{' '}
              <Link 
                component="button" 
                variant="body2" 
                onClick={() => navigate('/login')}
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                Giriş yapın
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register; 