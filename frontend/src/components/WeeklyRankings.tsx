import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Tab,
  Tabs,
  Alert,
  LinearProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';

import { 
  EmojiEvents, 
  Star, 
  TrendingUp,
  WorkspacePremium,
  History
} from '@mui/icons-material';
import { WeeklyRanking, WeeklyUserRanking, User } from '../types';
import { Link as RouterLink } from 'react-router-dom';
import ResponsiveTable from './ResponsiveTable';
import { usersAPI, awardsAPI } from '../services/api';

interface WeeklyRankingsProps {
  currentUser: User;
}

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
      id={`weekly-tabpanel-${index}`}
      aria-labelledby={`weekly-tab-${index}`}
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

// Real data interfaces for API responses
interface ApiUser {
  id: number;
  username: string;
  points: number;
}

interface ApiWeekRanking {
  week_start: string;
  week_end: string;
  week_label: string;
  rankings: Array<{
    id: number;
    username: string;
    weekly_points: number;
    position: number;
    has_award: boolean;
  }>;
}

// Previous weeks API çağrılarını awards API'den çekeceğiz

const WeeklyRankings: React.FC<WeeklyRankingsProps> = ({ currentUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [currentWeekRankings, setCurrentWeekRankings] = useState<WeeklyUserRanking[]>([]);
  const [previousWeekRankings, setPreviousWeekRankings] = useState<WeeklyRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Bu haftanın sıralamasını getir (kullanıcı sıralaması)
  const fetchCurrentWeekRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.getLeaderboard();
      if (response.success) {
        const apiUsers: ApiUser[] = response.data;
        const rankings: WeeklyUserRanking[] = apiUsers.map((user, index) => ({
          userId: user.id.toString(),
          userName: user.username,
          weeklyScore: user.points,
          position: index + 1,
          rewardGiven: false // Bu bilgiyi şimdilik false yapıyoruz
        }));
        setCurrentWeekRankings(rankings);
      } else {
        setError(response.error || 'Sıralama verisi alınamadı');
      }
    } catch (error) {
      setError('Sıralama verisi alınırken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Geçmiş haftalık sıralamaları getir (admin API'si)
  const fetchPreviousWeekRankings = async () => {
    try {
      const response = await awardsAPI.getWeeklyRankings();
      if (response.success) {
        const apiWeeks: ApiWeekRanking[] = response.data;
        const weeklyRankings: WeeklyRanking[] = apiWeeks.map((week, index) => ({
          id: (index + 1).toString(),
          week: parseInt(week.week_start.split('-').slice(-1)[0]), // Haftayı çıkar
          year: parseInt(week.week_start.split('-')[0]),
          weekStartDate: new Date(week.week_start),
          weekEndDate: new Date(week.week_end),
          isCompleted: true,
          createdAt: new Date(),
          rankings: week.rankings.slice(0, 3).map(ranking => ({
            userId: ranking.id.toString(),
            userName: ranking.username,
            weeklyScore: ranking.weekly_points,
            position: ranking.position,
            rewardGiven: ranking.has_award
          }))
        }));
        setPreviousWeekRankings(weeklyRankings);
      }
    } catch (error) {
      console.error('Previous week rankings error:', error);
    }
  };

  useEffect(() => {
    fetchCurrentWeekRankings();
    if (tabValue === 1) {
      fetchPreviousWeekRankings();
    }
  }, [tabValue]);

  const getRankColor = (position: number) => {
    switch (position) {
      case 1:
        return '#ffb74d'; // Yumuşak altın
      case 2:
        return '#90caf9'; // Yumuşak gümüş
      case 3:
        return '#81c784'; // Yumuşak bronz
      default:
        return 'inherit';
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Typography sx={{ fontSize: '1.5rem' }}>🥇</Typography>;
      case 2:
        return <Typography sx={{ fontSize: '1.5rem' }}>🥈</Typography>;
      case 3:
        return <Typography sx={{ fontSize: '1.5rem' }}>🥉</Typography>;
      default:
        return null;
    }
  };

  const currentUserRanking = currentWeekRankings.find(r => r.userId === currentUser.id.toString());

  return (
    <Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="weekly rankings tabs">
          <Tab 
            label="Bu Hafta" 
            icon={<TrendingUp />}
            iconPosition="start"
          />
          <Tab 
            label="Geçmiş Haftalar" 
            icon={<History />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Haftalık Sıralama
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button onClick={fetchCurrentWeekRankings} sx={{ ml: 2 }}>
              Tekrar Dene
            </Button>
          </Alert>
        ) : currentWeekRankings.length > 0 ? (
          <ResponsiveTable minWidth={500}>
              <TableHead>
                <TableRow>
                  <TableCell>Sıra</TableCell>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell align="right">Haftalık Puan</TableCell>
                  <TableCell align="center">Ödül</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentWeekRankings.map((ranking) => (
                <TableRow 
                  key={ranking.userId}
                  sx={{ 
                    bgcolor: ranking.userId === currentUser.id.toString() ? 'action.hover' : 'inherit',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getRankIcon(ranking.position)}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          ml: 1, 
                          fontWeight: 'bold',
                          color: ranking.position <= 3 ? getRankColor(ranking.position) : 'inherit'
                        }}
                      >
                        #{ranking.position}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link 
                        component={RouterLink}
                        to={`/profile/${ranking.userName}`}
                        sx={{ 
                          textDecoration: 'none',
                          color: ranking.userName === currentUser.name ? 'primary.main' : 'text.primary',
                          fontWeight: ranking.userName === currentUser.name ? 'bold' : 'normal',
                          '&:hover': {
                            textDecoration: 'underline',
                            color: 'primary.main'
                          }
                        }}
                      >
                        {ranking.userName}
                      </Link>
                      {ranking.userId === currentUser.id && (
                        <Chip label="Siz" size="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {ranking.weeklyScore}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {ranking.position <= 3 ? (
                      <Chip 
                        label={
                          ranking.position === 1 ? "1. Ödül" :
                          ranking.position === 2 ? "2. Ödül" : "3. Ödül"
                        }
                        color={
                          ranking.position === 1 ? "warning" :
                          ranking.position === 2 ? "default" : "success"
                        }
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </ResponsiveTable>
        ) : (
          <Alert severity="info">
            Henüz sıralama verisi bulunmamaktadır.
          </Alert>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Geçmiş Haftalık Sıralamalar
        </Typography>
        
        {previousWeekRankings.map((weekRanking) => (
          <Card key={weekRanking.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {weekRanking.year} - {weekRanking.week}. Hafta
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {weekRanking.weekStartDate.toLocaleDateString('tr-TR')} - {weekRanking.weekEndDate.toLocaleDateString('tr-TR')}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {weekRanking.rankings.slice(0, 3).map((ranking) => (
                  <Box 
                    key={ranking.userId}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      p: 1,
                      bgcolor: ranking.userName === currentUser.name ? 'action.hover' : 'background.default',
                      borderRadius: 1,
                      border: ranking.userName === currentUser.name ? '2px solid' : '1px solid',
                      borderColor: ranking.userName === currentUser.name ? 'primary.main' : 'divider'
                    }}
                  >
                    {getRankIcon(ranking.position)}
                    <Link 
                      component={RouterLink}
                      to={`/profile/${ranking.userName}`}
                      sx={{ 
                        textDecoration: 'none',
                        color: ranking.userName === currentUser.name ? 'primary.main' : 'text.primary',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        '&:hover': {
                          textDecoration: 'underline',
                          color: 'primary.main'
                        }
                      }}
                    >
                      {ranking.userName}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      ({ranking.weeklyScore} puan)
                    </Typography>
                    {ranking.rewardGiven && (
                      <Chip label="Ödül Verildi" size="small" color="success" />
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        ))}
      </TabPanel>
    </Box>
  );
};

export default WeeklyRankings; 