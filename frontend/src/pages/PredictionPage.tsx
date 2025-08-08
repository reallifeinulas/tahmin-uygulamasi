import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Paper,
  Container,
  Divider,
  ButtonGroup
} from '@mui/material';
import { SportsSoccer, Send, ArrowBack, TrendingUp } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Match, BetType } from '../types';
import Layout from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';

// Mock data - güncellenen yapı
const mockMatches = [
  {
    id: '1',
    homeTeam: 'Galatasaray',
    awayTeam: 'Fenerbahçe',
    league: 'Süper Lig',
    matchDate: new Date('2024-01-15T19:00:00'),
    description: 'Derbi maçı',
    isFinished: false,
    createdAt: new Date(),
    homeWinPoints: 18.5,
    drawPoints: 28.0,
    awayWinPoints: 22.5
  },
  {
    id: '2',
    homeTeam: 'Beşiktaş',
    awayTeam: 'Trabzonspor',
    league: 'Süper Lig',
    matchDate: new Date('2024-01-16T20:00:00'),
    description: 'Haftanın maçı',
    isFinished: false,
    createdAt: new Date(),
    homeWinPoints: 15.0,
    drawPoints: 25.0,
    awayWinPoints: 20.0
  }
];

const PredictionPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<any>(null);
  const [selectedBet, setSelectedBet] = useState<BetType | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Mock data'dan maçı bul
    const foundMatch = mockMatches.find(m => m.id === matchId);
    if (foundMatch) {
      setMatch(foundMatch);
    }
  }, [matchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedBet) {
      setError('Lütfen bir tahmin seçin.');
      return;
    }

    // TODO: API call to save prediction
    console.log('Tahmin:', {
      matchId,
      userId: user?.id,
      betType: selectedBet,
      points: match?.homeWinPoints || 0
    });

    setSuccess(true);
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getBetPoints = (betType: BetType) => {
    switch(betType) {
      case 'home':
        return match?.homeWinPoints || 0;
      case 'draw':
        return match?.drawPoints || 0;
      case 'away':
        return match?.awayWinPoints || 0;
      default:
        return 0;
    }
  };

  const getBetLabel = (betType: BetType) => {
    switch(betType) {
      case 'home':
        return `1 - ${match?.homeTeam}`;
      case 'draw':
        return 'X - Beraberlik';
      case 'away':
        return `2 - ${match?.awayTeam}`;
      default:
        return '';
    }
  };

  if (!user) {
    return (
      <Layout>
        <Alert severity="warning">
          Lütfen giriş yapınız.
        </Alert>
      </Layout>
    );
  }

  if (!match) {
    return (
      <Layout>
        <Alert severity="error">
          Maç bulunamadı.
        </Alert>
      </Layout>
    );
  }

  if (match.isFinished) {
    return (
      <Layout>
        <Alert severity="info">
          Bu maç zaten bitti. Tahmin veremezsiniz.
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="md">
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ mb: 2 }}
          >
            Ana Sayfaya Dön
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Tahmin Ver
          </Typography>
        </Box>

        {success ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            Tahminiz başarıyla kaydedildi! Ana sayfaya yönlendiriliyorsunuz...
          </Alert>
        ) : (
          <Paper elevation={3} sx={{ p: 4 }}>
            {/* Match Info */}
            <Card sx={{ 
              mb: 4, 
              bgcolor: 'rgba(77,77,77,0.3)', 
              border: '1px solid rgba(77,77,77,0.5)',
              color: 'white' 
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={match.league} 
                    sx={{ 
                      bgcolor: 'rgba(77,77,77,0.5)', 
                      color: '#ffffff',
                      border: '1px solid rgba(77,77,77,0.7)' 
                    }}
                    size="small"
                  />
                  <Typography variant="body2">
                    {formatDate(match.matchDate)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                    {match.homeTeam}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mx: 2 }}>
                    <SportsSoccer sx={{ mx: 1 }} />
                    <Typography variant="h5" sx={{ mx: 1 }}>VS</Typography>
                    <SportsSoccer sx={{ mx: 1 }} />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                    {match.awayTeam}
                  </Typography>
                </Box>

                {match.description && (
                  <Typography variant="body1" sx={{ textAlign: 'center', opacity: 0.9 }}>
                    {match.description}
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Betting Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Tahmin Seçin
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4 }}>
                {(['home', 'draw', 'away'] as BetType[]).map((betType) => (
                  <Box key={betType} sx={{ flex: 1 }}>
                    <Button
                      variant={selectedBet === betType ? 'contained' : 'outlined'}
                      fullWidth
                      size="large"
                      onClick={() => setSelectedBet(betType)}
                      sx={{
                        height: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        border: selectedBet === betType ? '3px solid' : '2px solid',
                        borderColor: selectedBet === betType ? 'primary.main' : 'grey.300',
                        '&:hover': {
                          borderColor: 'primary.main',
                          borderWidth: '3px'
                        }
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {betType === 'home' ? '1' : betType === 'draw' ? 'X' : '2'}
                      </Typography>
                      <Typography variant="body2" sx={{ textAlign: 'center' }}>
                        {getBetLabel(betType)}
                      </Typography>
                      <Chip
                        label={`${getBetPoints(betType)} Puan`}
                        size="small"
                        color={selectedBet === betType ? 'secondary' : 'primary'}
                        sx={{ fontWeight: 'bold' }}
                                             />
                     </Button>
                   </Box>
                 ))}
               </Box>

              {selectedBet && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Seçiminiz:</strong> {getBetLabel(selectedBet)} - 
                    <strong> {getBetPoints(selectedBet)} Puan</strong> kazanacaksınız!
                  </Typography>
                </Alert>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Tahminizi gönderdikten sonra değiştiremezsiniz. Lütfen dikkatli olun.
                </Typography>
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<Send />}
                  disabled={!selectedBet}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold'
                  }}
                >
                  Tahmin Gönder
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Container>
    </Layout>
  );
};

export default PredictionPage; 