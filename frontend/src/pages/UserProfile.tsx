import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Tab,
  Tabs,
  Container,
  Alert,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useMediaQuery,
  useTheme,
  TextField,
  Button,
  IconButton,
  Stack
} from '@mui/material';
import { 
  EmojiEvents, 
  History,
  TrendingUp,
  CheckCircle,
  Cancel,
  Pending,
  Comment,
  Send,
  Delete
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ResponsiveTable from '../components/ResponsiveTable';
import { usersAPI, predictionsAPI, awardsAPI, socialAPI } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface UserStats {
  total_predictions: number;
  correct_predictions: number;
  completed_predictions: number;
  success_rate: number;
  points_earned: number;
  prediction_distribution: {
    home: number;
    away: number;
    draw: number;
  };
}

interface PredictionHistory {
  id: number;
  match_id: number;
  selected_team: 'home' | 'away' | 'draw';
  home_team: string;
  away_team: string;
  match_date: string;
  status: 'active' | 'completed';
  result?: 'home' | 'away' | 'draw';
  home_points: number;
  away_points: number;
  draw_points: number;
  is_correct?: number;
  points_earned?: number;
}

interface UserInventoryItem {
  id: number;
  week_start: string;
  week_end: string;
  position: number;
  reward_code: string;
  description?: string;
  awarded_by_name?: string;
  created_at: string;
}

interface ProfileVisit {
  visit_count: number;
  first_visit_at: string;
  last_visit_at: string;
  visitor_id: number;
  visitor_username: string;
}

interface ProfileComment {
  id: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  commenter_id: number;
  commenter_username: string;
}

interface ViewedUser {
  id: number;
  username: string;
  email: string;
  points: number;
  created_at: string;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
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

const UserProfile: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { username } = useParams<{ username: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [viewedUser, setViewedUser] = useState<ViewedUser | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionHistory[]>([]);
  const [userInventory, setUserInventory] = useState<UserInventoryItem[]>([]);

  const [profileComments, setProfileComments] = useState<ProfileComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Görüntülenen kullanıcı current user mı?
  const isOwnProfile = currentUser && username === currentUser.name;
  
  // Yorumlar tab'ının index'i dinamik (envanter tab'ına bağlı)
  const commentsTabIndex = isOwnProfile ? 3 : 2;

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isOwnProfile) {
        // Kendi profilini getir
        response = await usersAPI.getProfile();
      } else {
        // Başka kullanıcının profilini getir
        response = await usersAPI.getUserProfile(username!);
      }
      
      if (response.success) {
        setViewedUser(response.data);
      } else {
        setError(response.error || 'Kullanıcı profili yüklenirken hata oluştu');
      }
    } catch (error) {
      setError('Kullanıcı profili yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isOwnProfile) {
        // Kendi istatistiklerini getir
        response = await usersAPI.getStats();
      } else {
        // Başka kullanıcının istatistiklerini getir
        response = await usersAPI.getUserStats(username!);
      }
      
      if (response.success) {
        setUserStats(response.data);
      } else {
        setError(response.error || 'İstatistikler yüklenirken hata oluştu');
      }
    } catch (error) {
      setError('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictionHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (isOwnProfile) {
        // Kendi tahmin geçmişini getir
        response = await predictionsAPI.getMyPredictions();
      } else {
        // Başka kullanıcının tahmin geçmişini getir (sadece tamamlanmış maçlar)
        response = await predictionsAPI.getUserPredictions(username!);
      }
      
      if (response.success) {
        setPredictionHistory(response.data || []);
      } else {
        setError(response.error || 'Tahmin geçmişi yüklenirken hata oluştu');
      }
    } catch (error) {
      setError('Tahmin geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInventory = async () => {
    // Envanter sadece kendi profili için
    if (!isOwnProfile) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await awardsAPI.getMyAwards();
      if (response.success) {
        setUserInventory(response.data);
      } else {
        setError(response.error || 'Envanter yüklenirken hata oluştu');
      }
    } catch (error) {
      setError('Envanter yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };





  const fetchProfileComments = async () => {
    if (!username) return;
    
    try {
      const response = await socialAPI.getComments(username);
      if (response.success) {
        setProfileComments(response.data || []);
      }
    } catch (error) {
      console.error('Fetch comments error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!username || !newComment.trim()) return;
    
    setCommentLoading(true);
    try {
      const response = await socialAPI.addComment(username, newComment.trim());
      if (response.success) {
        setNewComment('');
        fetchProfileComments(); // Yorumları yenile
      } else {
        setError(response.error || 'Yorum eklenirken hata oluştu');
      }
    } catch (error) {
      setError('Yorum eklenirken hata oluştu');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await socialAPI.deleteComment(commentId);
      if (response.success) {
        fetchProfileComments(); // Yorumları yenile
      } else {
        setError(response.error || 'Yorum silinirken hata oluştu');
      }
    } catch (error) {
      setError('Yorum silinirken hata oluştu');
    }
  };

  useEffect(() => {
    // Kullanıcı profili her zaman gerekli
    fetchUserProfile();
    
    // Kendi profili değilse ziyaret kaydet
    if (!isOwnProfile) {

    }
  }, [username, currentUser]);

  useEffect(() => {
    if (viewedUser && tabValue === 0) {
      // İstatistikler sekmesi (index 0)
      fetchUserStats();
    }
    if (viewedUser && tabValue === 1) {
      // Tahmin Geçmişi sekmesi (index 1)
      fetchPredictionHistory();
    }
    if (viewedUser && tabValue === 2 && isOwnProfile) {
      // Envanter sekmesi (index 2) - sadece kendi profili için
      fetchUserInventory();
    }
    if (viewedUser && tabValue === commentsTabIndex) {
      // Sosyal sekmesi - yorumlar

      fetchProfileComments();
    }
  }, [viewedUser, tabValue, isOwnProfile]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  // Eğer giriş yapmamışsa
  if (!currentUser) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            Lütfen giriş yapınız.
          </Alert>
        </Container>
      </Layout>
    );
  }

  // Loading durumu
  if (loading && !viewedUser) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Layout>
    );
  }

  // Error durumu
  if (error && !viewedUser) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            {error}
          </Alert>
        </Container>
      </Layout>
    );
  }

  // Kullanıcı bulunamadı
  if (!viewedUser) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning">
            Kullanıcı bulunamadı.
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Profil Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              {viewedUser.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {viewedUser.username}
                {isOwnProfile && <Chip label="Siz" size="small" sx={{ ml: 2 }} />}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip 
                  label={`${viewedUser.points} Puan`}
                  color="primary"
                  variant="outlined"
                />
                {isOwnProfile && currentUser.isAdmin && (
                  <Chip 
                    label="Admin"
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Tabs */}
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab 
              icon={<TrendingUp />} 
              label="İstatistikler" 
              iconPosition="start"
            />
            <Tab 
              icon={<History />} 
              label="Tahmin Geçmişi" 
              iconPosition="start"
            />
            {/* Envanter sadece kendi profili için göster */}
            {isOwnProfile && (
              <Tab 
                icon={<EmojiEvents />} 
                label="Envanter" 
                iconPosition="start"
              />
            )}
            {/* Sosyal özellikler - herkese açık */}
            <Tab 
              icon={<Comment />} 
              label="Yorumlar" 
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Contents */}

                      <TabPanel value={tabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : userStats ? (
                             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                 {/* İlk satır - Genel ve Puan İstatistikleri */}
                 <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                   {/* Genel İstatistikler */}
                   <Box sx={{ flex: 1, minWidth: 300 }}>
                     <Card>
                       <CardContent>
                         <Typography variant="h6" gutterBottom>
                           Genel İstatistikler
                         </Typography>
                         <Box sx={{ mt: 2 }}>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="body2">Toplam Tahmin:</Typography>
                             <Typography variant="body2" fontWeight="bold">
                               {userStats.total_predictions}
                             </Typography>
                           </Box>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="body2">Doğru Tahmin:</Typography>
                             <Typography variant="body2" fontWeight="bold" color="success.main">
                               {userStats.correct_predictions}
                             </Typography>
                           </Box>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="body2">Başarı Oranı:</Typography>
                             <Typography variant="body2" fontWeight="bold">
                               %{userStats.success_rate}
                             </Typography>
                           </Box>
                           <Box sx={{ mt: 2 }}>
                             <Typography variant="body2" gutterBottom>
                               Başarı Oranı: %{userStats.success_rate}
                             </Typography>
                             <LinearProgress 
                               variant="determinate" 
                               value={userStats.success_rate} 
                               sx={{ height: 8, borderRadius: 1 }}
                             />
                           </Box>
                         </Box>
                       </CardContent>
                     </Card>
                   </Box>

                   {/* Puan İstatistikleri */}
                   <Box sx={{ flex: 1, minWidth: 300 }}>
                     <Card>
                       <CardContent>
                         <Typography variant="h6" gutterBottom>
                           Puan İstatistikleri
                         </Typography>
                         <Box sx={{ mt: 2 }}>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="body2">Mevcut Puan:</Typography>
                             <Typography variant="body2" fontWeight="bold" color="primary.main">
                               {viewedUser.points || 0}
                             </Typography>
                           </Box>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="body2">Kazanılan Puan:</Typography>
                             <Typography variant="body2" fontWeight="bold" color="success.main">
                               {userStats.points_earned}
                             </Typography>
                           </Box>
                           <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                             <Typography variant="body2">Tamamlanan Maç:</Typography>
                             <Typography variant="body2" fontWeight="bold">
                               {userStats.completed_predictions}
                             </Typography>
                           </Box>
                         </Box>
                       </CardContent>
                     </Card>
                   </Box>
                 </Box>

                 {/* İkinci satır - Tahmin Dağılımı */}
                 <Card>
                   <CardContent>
                     <Typography variant="h6" gutterBottom>
                       Tahmin Dağılımı
                     </Typography>
                     <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                       <Box sx={{ textAlign: 'center' }}>
                         <Typography variant="h4" color="primary.main">
                           {userStats.prediction_distribution.home}
                         </Typography>
                         <Typography variant="body2">Ev Sahibi</Typography>
                       </Box>
                       <Box sx={{ textAlign: 'center' }}>
                         <Typography variant="h4" color="warning.main">
                           {userStats.prediction_distribution.draw}
                         </Typography>
                         <Typography variant="body2">Beraberlik</Typography>
                       </Box>
                       <Box sx={{ textAlign: 'center' }}>
                         <Typography variant="h4" color="error.main">
                           {userStats.prediction_distribution.away}
                         </Typography>
                         <Typography variant="body2">Deplasman</Typography>
                       </Box>
                     </Box>
                   </CardContent>
                 </Card>
               </Box>
            ) : (
              <Alert severity="info">İstatistik verisi bulunamadı.</Alert>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : predictionHistory.length > 0 ? (
              <ResponsiveTable minWidth={600}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Maç</TableCell>
                      <TableCell>Tahmin</TableCell>
                      <TableCell>Sonuç</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Puan</TableCell>
                      <TableCell>Tarih</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {predictionHistory.map((prediction) => {
                      const getTeamName = (team: string) => {
                        switch (team) {
                          case 'home': return prediction.home_team;
                          case 'away': return prediction.away_team;
                          case 'draw': return 'Beraberlik';
                          default: return team;
                        }
                      };

                      const getResultText = (result?: string) => {
                        if (!result) return '-';
                        switch (result) {
                          case 'home': return `${prediction.home_team} Kazandı`;
                          case 'away': return `${prediction.away_team} Kazandı`;
                          case 'draw': return 'Beraberlik';
                          default: return result;
                        }
                      };

                      const getStatusIcon = () => {
                        if (prediction.status === 'active') {
                          return <Pending color="warning" />;
                        }
                        if (prediction.is_correct === 1) {
                          return <CheckCircle color="success" />;
                        }
                        if (prediction.is_correct === 0) {
                          return <Cancel color="error" />;
                        }
                        return <Pending color="disabled" />;
                      };

                      const getStatusText = () => {
                        if (prediction.status === 'active') {
                          return 'Beklemede';
                        }
                        if (prediction.is_correct === 1) {
                          return 'Doğru';
                        }
                        if (prediction.is_correct === 0) {
                          return 'Yanlış';
                        }
                        return 'Bilinmiyor';
                      };

                      return (
                        <TableRow key={prediction.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {prediction.home_team} vs {prediction.away_team}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={getTeamName(prediction.selected_team)}
                              size="small"
                              color={
                                prediction.selected_team === 'home' ? 'primary' :
                                prediction.selected_team === 'away' ? 'error' : 'warning'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {getResultText(prediction.result)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getStatusIcon()}
                              <Typography variant="body2">
                                {getStatusText()}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              color={prediction.points_earned ? 'success.main' : 'text.secondary'}
                            >
                              {prediction.points_earned || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(prediction.match_date).toLocaleDateString('tr-TR')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
              </ResponsiveTable>
            ) : (
              <Alert severity="info">
                {isOwnProfile ? 'Henüz tahmin yapmamışsınız.' : `${viewedUser.username} henüz tahmin yapmamış.`}
              </Alert>
            )}
          </TabPanel>

          {/* Envanter sekmesi - sadece kendi profili için */}
          {isOwnProfile && (
            <TabPanel value={tabValue} index={2}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : userInventory.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    🎁 Envanterim
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Kazandığınız kupon kodları ve ödüllerinizi buradan görebilirsiniz.
                  </Typography>



                  {/* Kupon Listesi */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {userInventory.map((item) => (
                      <Card 
                        key={item.id} 
                        elevation={2} 
                        sx={{
                          border: item.position === 1 ? '2px solid #FFD700' :
                                 item.position === 2 ? '2px solid #C0C0C0' :
                                 item.position === 3 ? '2px solid #CD7F32' : '1px solid #e0e0e0',
                          transition: 'all 0.3s ease',
                          '&:hover': { boxShadow: 4 }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography sx={{ fontSize: '2rem' }}>
                                {item.position === 1 ? '🥇' : 
                                 item.position === 2 ? '🥈' : 
                                 item.position === 3 ? '🥉' : '🏆'}
                              </Typography>
                              <Box>
                                <Typography variant="h6" fontWeight="bold">
                                  {item.position}. Sıra Ödülü
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {new Date(item.week_start).toLocaleDateString('tr-TR')} - {new Date(item.week_end).toLocaleDateString('tr-TR')}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip 
                              label={`Pos. ${item.position}`}
                              color={item.position <= 3 ? 'primary' : 'default'}
                              size="small"
                            />
                          </Box>

                          {/* Kupon Kodu */}
                          <Box sx={{ 
                            bgcolor: 'grey.100', 
                            p: 2, 
                            borderRadius: 1, 
                            border: '1px dashed #ccc',
                            mb: 2
                          }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              🎫 Kupon Kodu:
                            </Typography>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontFamily: 'monospace', 
                                fontWeight: 'bold',
                                letterSpacing: 1,
                                color: 'primary.main'
                              }}
                            >
                              {item.reward_code}
                            </Typography>
                          </Box>

                          {/* Açıklama */}
                          {item.description && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                📝 Açıklama:
                              </Typography>
                              <Typography variant="body2">
                                {item.description}
                              </Typography>
                            </Box>
                          )}

                          {/* Alt Bilgiler */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                            <Typography variant="caption" color="text.secondary">
                              Kazanma Tarihi: {new Date(item.created_at).toLocaleDateString('tr-TR')}
                            </Typography>
                            {item.awarded_by_name && (
                              <Typography variant="caption" color="text.secondary">
                                Veren Admin: {item.awarded_by_name}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Alert severity="info" sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    📦 Envanter Boş
                  </Typography>
                  <Typography variant="body1">
                    Henüz hiç ödül kazanmamışsınız. Haftalık sıralamada ilk 3'e girerek kupon kazanabilirsiniz!
                  </Typography>
                </Alert>
              )}
            </TabPanel>
          )}

          {/* Sosyal Sekmesi - Ziyaretler ve Yorumlar */}
          <TabPanel value={tabValue} index={commentsTabIndex}>
            <Typography variant="h6" gutterBottom>
              💬 Profil Yorumları
            </Typography>

            {/* Yorum Ekleme Formu (sadece başkalarının profilinde) */}
            {!isOwnProfile && (
              <Card sx={{ mb: 3, p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Yorum Bırak
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Bu kullanıcıya bir yorum bırakın... (max 500 karakter)"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    inputProps={{ maxLength: 500 }}
                    helperText={`${newComment.length}/500 karakter`}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Send />}
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || commentLoading}
                    sx={{ minWidth: 120 }}
                  >
                    {commentLoading ? <CircularProgress size={20} /> : 'Gönder'}
                  </Button>
                </Stack>
              </Card>
            )}

            {/* Yorumlar Listesi */}
            {profileComments.length > 0 ? (
              <Box sx={{ mt: 2 }}>
                {profileComments.map((comment) => (
                  <Card key={comment.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {comment.commenter_username.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {comment.commenter_username}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                              {comment.comment_text}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.created_at).toLocaleDateString('tr-TR')} {new Date(comment.created_at).toLocaleTimeString('tr-TR')}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Silme butonu (sadece kendi yorumu için) */}
                        {currentUser && comment.commenter_id === parseInt(currentUser.id) && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteComment(comment.id)}
                            sx={{ ml: 1 }}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>
                Henüz yorum bulunmamaktadır. İlk yorumu sen bırak!
              </Alert>
            )}


          </TabPanel>

        </Paper>
      </Container>
    </Layout>
  );
};

export default UserProfile; 