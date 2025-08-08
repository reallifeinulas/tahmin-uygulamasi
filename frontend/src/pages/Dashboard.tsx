import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Alert,
  Tab,
  Tabs,
  Container,
  Paper,
  CircularProgress,
  TextField,
  Stack
} from '@mui/material';
import { SportsSoccer, EmojiEvents, TrendingUp, Assignment, Send, Timer } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Match, BetType, WeeklyUserRanking } from '../types';
import Layout from '../components/Layout';
import WeeklyRankings from '../components/WeeklyRankings';
import { useNavigate } from 'react-router-dom';
import { 
  getCurrentWeekInfo, 
  getTimeUntilWeekEnd, 
  formatWeekPeriod 
} from '../utils/weeklyRanking';
import { matchesAPI, predictionsAPI } from '../services/api';

// Backend'den gelecek gerçek veriler için state types
interface BackendMatch {
  id: number;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_points: number;
  away_points: number;
  draw_points: number;
  created_at: string;
  updated_at: string;
}

interface BackendPrediction {
  id: number;
  match_id: number;
  selected_team: string;
  points: number;
  created_at: string;
  home_team: string;
  away_team: string;
  match_date: string;
  status: string;
}

// WeeklyRankings component kendi veri yönetimini yapacak

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PredictionCard: React.FC<{ 
  match: BackendMatch, 
  userPrediction?: BackendPrediction,
  onPredictionUpdate?: () => Promise<void> 
}> = ({ match, userPrediction, onPredictionUpdate }) => {
  const [selectedTeam, setSelectedTeam] = useState<string>(userPrediction?.selected_team || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit' 
    });
  };

  const isDeadlinePassed = () => {
    const matchDate = new Date(match.match_date);
    const now = new Date();
    const deadlineTime = new Date(matchDate.getTime() - 10 * 60 * 1000); // 10 dakika önce
    return now > deadlineTime;
  };

  const getDeadlineInfo = () => {
    const matchDate = new Date(match.match_date);
    const deadlineTime = new Date(matchDate.getTime() - 10 * 60 * 1000); // 10 dakika önce
    const now = new Date();
    
    if (now > deadlineTime) {
      return { passed: true, message: 'Tahmin süresi doldu' };
    }
    
    const timeLeft = deadlineTime.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursLeft > 0) {
      return { passed: false, message: `${hoursLeft}s ${minutesLeft}dk kaldı` };
    } else if (minutesLeft > 0) {
      return { passed: false, message: `${minutesLeft} dakika kaldı` };
    } else {
      return { passed: false, message: 'Son dakikalar!' };
    }
  };

  const handleTeamSelect = (team: string) => {
    if (isDeadlinePassed()) {
      toast.showWarning('Tahmin süresi doldu. Maç başlamadan 10 dakika önce tahminler kapanır.');
      return;
    }
    setSelectedTeam(team);
  };

  const handleSubmitPrediction = async () => {
    if (!selectedTeam) {
      toast.showWarning('Lütfen bir seçim yapın');
      return;
    }

    if (isDeadlinePassed()) {
      toast.showWarning('Tahmin süresi doldu. Maç başlamadan 10 dakika önce tahminler kapanır.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await predictionsAPI.createPrediction({
        match_id: match.id,
        selected_team: selectedTeam
      });

      if (response.success) {
        toast.showSuccess('Tahmin başarıyla kaydedildi!');
        if (onPredictionUpdate) {
          await onPredictionUpdate();
        }
      } else {
        toast.showError(response.error || 'Tahmin kaydedilemedi');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      toast.showError('Tahmin kaydedilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPredictionText = (team: string) => {
    switch (team) {
      case 'home': return `${match.home_team} Kazanır`;
      case 'away': return `${match.away_team} Kazanır`;
      case 'draw': return 'Beraberlik';
      default: return '';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SportsSoccer sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="h3">
            {match.home_team} vs {match.away_team}
          </Typography>
        </Box>
        
        <Typography color="text.secondary" gutterBottom>
          {match.league} • {formatDate(match.match_date)}
        </Typography>

        {/* Deadline Bilgisi */}
        {match.status === 'active' && (
          <Box sx={{ mb: 2 }}>
            <Chip 
              label={`⏰ ${getDeadlineInfo().message}`}
              color={getDeadlineInfo().passed ? 'error' : 'info'}
              size="small"
              variant="outlined"
            />
          </Box>
        )}

        {match.status === 'completed' && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Chip 
              label={`Sonuç: ${match.home_score} - ${match.away_score}`} 
              color="success" 
              size="small" 
            />
          </Box>
        )}

        {match.status === 'active' && !isDeadlinePassed() && !userPrediction && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Tahmininiz:
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                variant={selectedTeam === 'home' ? 'contained' : 'outlined'}
                onClick={() => handleTeamSelect('home')}
                disabled={isSubmitting}
                fullWidth
                sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <Box>{match.home_team}</Box>
                <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {match.home_points} puan
                </Box>
              </Button>
              <Button
                variant={selectedTeam === 'draw' ? 'contained' : 'outlined'}
                onClick={() => handleTeamSelect('draw')}
                disabled={isSubmitting}
                fullWidth
                sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <Box>Beraberlik</Box>
                <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {match.draw_points} puan
                </Box>
              </Button>
              <Button
                variant={selectedTeam === 'away' ? 'contained' : 'outlined'}
                onClick={() => handleTeamSelect('away')}
                disabled={isSubmitting}
                fullWidth
                sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
              >
                <Box>{match.away_team}</Box>
                <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  {match.away_points} puan
                </Box>
              </Button>
            </Stack>

            {selectedTeam && (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmitPrediction}
                  disabled={isSubmitting}
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : <Send />}
                  sx={{ minWidth: 120 }}
                >
                  Tahmin Et
                </Button>
              </Box>
            )}
          </Box>
        )}

        {userPrediction && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Tahmininiz: {getPredictionText(userPrediction.selected_team)}
              {userPrediction.points > 0 && (
                <Chip 
                  label={`${userPrediction.points} puan`} 
                  color="primary" 
                  size="small" 
                  sx={{ ml: 1 }} 
                />
              )}
            </Typography>
          </Box>
        )}

        {isDeadlinePassed() && match.status === 'active' && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label="Tahmin Süresi Doldu" 
              color="error" 
              size="small"
              icon={<Timer />}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<BackendMatch[]>([]);
  const [predictions, setPredictions] = useState<BackendPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [weekInfo, setWeekInfo] = useState(getCurrentWeekInfo());
  const [timeLeft, setTimeLeft] = useState(getTimeUntilWeekEnd());

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const matchesResponse = await matchesAPI.getAllMatches();
      if (!matchesResponse.success) {
        throw new Error(matchesResponse.error || 'Maçlar yüklenemedi');
      }

      const matchesData = matchesResponse.data || [];
      setMatches(matchesData);
      
      // Kullanıcının tahminlerini al
      const predictionsResponse = await predictionsAPI.getMyPredictions();
      if (predictionsResponse.success) {
        setPredictions(predictionsResponse.data || []);
      } else {
        setPredictions([]);
      }
      
    } catch (error) {
      console.error('Matches fetch error:', error);
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches();
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilWeekEnd());
      setWeekInfo(getCurrentWeekInfo());
    }, 60000); // Her dakika güncelle

    return () => clearInterval(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getUserPrediction = (matchId: number) => {
    return Array.isArray(predictions) ? predictions.find(p => p.match_id === matchId) : undefined;
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1: return '#FFD700'; // Altın
      case 2: return '#C0C0C0'; // Gümüş
      case 3: return '#CD7F32'; // Bronz
      default: return '#f5f5f5';
    }
  };

  const getPredictionText = (team: string, homeTeam?: string, awayTeam?: string) => {
    switch (team) {
      case 'home': return homeTeam ? `${homeTeam} Kazanır` : 'Ev Sahibi Kazanır';
      case 'away': return awayTeam ? `${awayTeam} Kazanır` : 'Deplasman Kazanır';
      case 'draw': return 'Beraberlik';
      default: return 'Bilinmeyen';
    }
  };

  if (!user) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            Lütfen giriş yapın.
          </Alert>
        </Container>
      </Layout>
    );
  }

  const activeMatches = matches.filter(m => m.status === 'active');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const userPredictionsWithDetails = Array.isArray(predictions) ? predictions.map(pred => {
    const match = matches.find(m => m.id === pred.match_id);
    return { ...pred, match };
  }) : [];

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Kullanıcı Bilgileri */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Hoş Geldin, {user.name}! 👋
              </Typography>
              <Typography variant="h6">
                Toplam Puanın: {user.score} 🎯
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" gutterBottom>
                {formatWeekPeriod(weekInfo.weekStart, weekInfo.weekEnd)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Timer sx={{ mr: 1 }} />
                <Typography variant="body1">
                  {timeLeft ? `${timeLeft.days}g ${timeLeft.hours}s ${timeLeft.minutes}d` : 'Hesaplanıyor...'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label="Aktif Maçlar" 
              icon={<SportsSoccer />}
              iconPosition="start"
            />
            <Tab 
              label="Tahminlerim" 
              icon={<Assignment />}
              iconPosition="start"
            />
            <Tab 
              label="Sıralama" 
              icon={<EmojiEvents />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" gutterBottom>
            Aktif Maçlar
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : activeMatches.length === 0 ? (
            <Alert severity="info">
              Şu anda aktif maç bulunmamaktadır.
            </Alert>
          ) : (
            activeMatches.map((match) => (
              <PredictionCard 
                key={match.id} 
                match={match} 
                userPrediction={getUserPrediction(match.id)}
                onPredictionUpdate={fetchMatches}
              />
            ))
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" gutterBottom>
            Tahminlerim
          </Typography>
          
          {predictions.length === 0 ? (
            <Alert severity="info">
              Henüz tahmin yapmadınız.
            </Alert>
          ) : (
            userPredictionsWithDetails.map((prediction) => (
              <Card key={prediction.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6">
                        {prediction.home_team} vs {prediction.away_team}
                      </Typography>
                      <Typography color="text.secondary">
                        Tahmininiz: {getPredictionText(prediction.selected_team, prediction.home_team, prediction.away_team)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip 
                        label={`${prediction.points} puan`} 
                        color={prediction.points > 0 ? 'success' : 'default'} 
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {formatDate(prediction.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <WeeklyRankings currentUser={user} />
        </TabPanel>
      </Container>
    </Layout>
  );
};

export default Dashboard; 