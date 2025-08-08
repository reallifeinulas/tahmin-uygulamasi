import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Add, Edit, Delete, Check } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import ResponsiveTable from '../components/ResponsiveTable';
import { matchesAPI, usersAPI, awardsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface BackendMatch {
  id: number;
  home_team: string;
  away_team: string;
  league: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  result: string | null;
  home_points: number;
  away_points: number;
  draw_points: number;
  created_at: string;
}

interface BackendUser {
  id: number;
  username: string;
  email: string;
  points: number;
  role: string;
  created_at: string;
}

interface WeeklyRankingUser {
  id: number;
  username: string;
  email: string;
  weekly_points: number;
  predictions_count: number;
  correct_predictions: number;
  position: number;
  has_award: boolean;
}

interface WeeklyRanking {
  week_start: string;
  week_end: string;
  week_label: string;
  rankings: WeeklyRankingUser[];
}

const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [matches, setMatches] = useState<BackendMatch[]>([]);
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [weeklyRankings, setWeeklyRankings] = useState<WeeklyRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addMatchDialog, setAddMatchDialog] = useState(false);
  const [resultDialog, setResultDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [awardDialog, setAwardDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<BackendMatch | null>(null);
  const [selectedUser, setSelectedUser] = useState<BackendUser | null>(null);
  const [selectedAwardUser, setSelectedAwardUser] = useState<{
    user: WeeklyRankingUser;
    week: WeeklyRanking;
  } | null>(null);
  
  // Gereksiz state kaldırıldı

  // Form states
  const [matchForm, setMatchForm] = useState({
    home_team: '',
    away_team: '',
    league: 'Süper Lig',
    match_date: '',
    home_points: 10,
    away_points: 10,
    draw_points: 15
  });

  const [resultForm, setResultForm] = useState({
    selected_result: ''
  });

  const [awardForm, setAwardForm] = useState({
    reward_code: '',
    description: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await matchesAPI.getAllMatches();
      if (response.success) {
        setMatches(response.data || []);
      } else {
        setError(response.error || 'Maçlar yüklenemedi');
      }
    } catch (error) {
      console.error('Matches fetch error:', error);
      setError('Maçlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAllUsers();
      if (response.success) {
        setUsers(response.data || []);
      } else {
        setError(response.error || 'Kullanıcılar yüklenemedi');
      }
    } catch (error) {
      console.error('Users fetch error:', error);
      setError('Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyRankings = async () => {
    try {
      setLoading(true);
      const response = await awardsAPI.getWeeklyRankings();
      if (response.success) {
        setWeeklyRankings(response.data || []);
      } else {
        setError(response.error || 'Haftalık sıralamalar yüklenemedi');
      }
    } catch (error) {
      console.error('Weekly rankings fetch error:', error);
      setError('Haftalık sıralamalar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

    // fetchLastResetInfo kaldırıldı - artık gerekli değil

  // Manuel reset kaldırıldı - şimdi otomatik sistem çalışıyor

  const handleGiveAward = async () => {
    if (!selectedAwardUser) return;

    try {
      setLoading(true);
      const response = await awardsAPI.giveAward({
        user_id: selectedAwardUser.user.id,
        week_start: selectedAwardUser.week.week_start,
        week_end: selectedAwardUser.week.week_end,
        position: selectedAwardUser.user.position,
        reward_code: awardForm.reward_code,
        description: awardForm.description
      });

      if (response.success) {
        setAwardDialog(false);
        setSelectedAwardUser(null);
        setAwardForm({ reward_code: '', description: '' });
        fetchWeeklyRankings(); // Refresh rankings
        toast.showSuccess(`Ödül başarıyla verildi! Ödül kodu: ${awardForm.reward_code}`);
      } else {
        setError(response.error || 'Ödül verilirken hata oluştu');
      }
    } catch (error) {
      console.error('Give award error:', error);
      setError('Ödül verilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateMatchForm = () => {
    const errors = [];

    // Required fields
    if (!matchForm.home_team.trim()) {
      errors.push('Ev sahibi takım adı gerekli');
    }
    if (!matchForm.away_team.trim()) {
      errors.push('Deplasman takım adı gerekli');
    }
    if (!matchForm.match_date) {
      errors.push('Maç tarihi gerekli');
    }
    if (!matchForm.league.trim()) {
      errors.push('Lig adı gerekli');
    }

    // Length validation
    if (matchForm.home_team.trim().length > 100) {
      errors.push('Ev sahibi takım adı 100 karakterden uzun olamaz');
    }
    if (matchForm.away_team.trim().length > 100) {
      errors.push('Deplasman takım adı 100 karakterden uzun olamaz');
    }
    if (matchForm.league.trim().length > 100) {
      errors.push('Lig adı 100 karakterden uzun olamaz');
    }

    // Date validation
    if (matchForm.match_date) {
      const matchDateTime = new Date(matchForm.match_date);
      const now = new Date();
      
      if (isNaN(matchDateTime.getTime())) {
        errors.push('Geçersiz tarih formatı');
      } else if (matchDateTime <= now) {
        errors.push('Maç tarihi gelecekte olmalıdır');
      }
    }

    // Points validation (sadece negatif değerleri ve aşırı büyük sayıları engelle)
    if (matchForm.home_points < 1) {
      errors.push('Ev sahibi puanı pozitif bir sayı olmalıdır');
    }
    if (matchForm.away_points < 1) {
      errors.push('Deplasman puanı pozitif bir sayı olmalıdır');
    }
    if (matchForm.draw_points < 1) {
      errors.push('Beraberlik puanı pozitif bir sayı olmalıdır');
    }
    
    // Aşırı büyük sayıları engelle
    if (matchForm.home_points > 10000) {
      errors.push('Ev sahibi puanı çok yüksek (max 10000)');
    }
    if (matchForm.away_points > 10000) {
      errors.push('Deplasman puanı çok yüksek (max 10000)');
    }
    if (matchForm.draw_points > 10000) {
      errors.push('Beraberlik puanı çok yüksek (max 10000)');
    }

    // Same team check
    if (matchForm.home_team.trim() && matchForm.away_team.trim() && 
        matchForm.home_team.trim().toLowerCase() === matchForm.away_team.trim().toLowerCase()) {
      errors.push('Bir takım kendisiyle oynayamaz');
    }

    return errors;
  };

  const handleAddMatch = async () => {
    // Frontend validation
    const errors = validateMatchForm();
    if (errors.length > 0) {
      setError(`Validation Hataları:\n${errors.join('\n')}`);
      return;
    }

    try {
      setError(null);
      const response = await matchesAPI.createMatch(matchForm);
      if (response.success) {
        setAddMatchDialog(false);
        setMatchForm({
          home_team: '',
          away_team: '',
          league: 'Süper Lig',
          match_date: '',
          home_points: 10,
          away_points: 10,
          draw_points: 15
        });
        fetchMatches();
        toast.showSuccess('Maç başarıyla eklendi!');
      } else {
        // Backend validation hatalarını göster
        if (response.errors && Array.isArray(response.errors)) {
          setError(`Sunucu Hataları:\n${response.errors.join('\n')}`);
        } else {
          setError(response.error || 'Maç eklenemedi');
        }
      }
    } catch (error) {
      console.error('Add match error:', error);
      setError('Maç eklenemedi');
    }
  };

  const handleSetResult = async () => {
    if (selectedMatch && resultForm.selected_result) {
      try {
        const response = await matchesAPI.setMatchResult(selectedMatch.id, resultForm.selected_result);
        if (response.success) {
          toast.showSuccess('Maç sonucu başarıyla kaydedildi!');
          setResultDialog(false);
          setSelectedMatch(null);
          setResultForm({ selected_result: '' });
          fetchMatches(); // Listeyi yenile
        } else {
          toast.showError(response.error || 'Maç sonucu kaydedilemedi');
        }
      } catch (error) {
        console.error('Set result error:', error);
        toast.showError('Maç sonucu kaydedilemedi');
      }
    } else {
              toast.showWarning('Lütfen bir sonuç seçin');
    }
  };

  const handleDeleteMatch = async () => {
    if (selectedMatch) {
      try {
        const response = await matchesAPI.deleteMatch(selectedMatch.id);
        if (response.success) {
          toast.showSuccess('Maç başarıyla silindi!');
          setDeleteDialog(false);
          setSelectedMatch(null);
          fetchMatches(); // Listeyi yenile
        } else {
          toast.showError(response.error || 'Maç silinemedi');
        }
      } catch (error) {
        console.error('Delete match error:', error);
        toast.showError('Maç silinemedi');
      }
    }
  };

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

  const getResultText = (match: BackendMatch) => {
    if (match.result === 'home') {
      return `${match.home_team} Kazandı`;
    } else if (match.result === 'away') {
      return `${match.away_team} Kazandı`;
    } else if (match.result === 'draw') {
      return 'Beraberlik';
    }
    return 'Henüz bitmedi';
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await usersAPI.deleteUser(selectedUser.id);
      
      if (response.success) {
        toast.showSuccess(`Kullanıcı "${selectedUser.username}" başarıyla silindi`);
        fetchUsers(); // Kullanıcı listesini yenile
      } else {
        toast.showError(response.error || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('User deletion error:', error);
      toast.showError('Kullanıcı silinirken bir hata oluştu');
    } finally {
      setDeleteUserDialog(false);
      setSelectedUser(null);
    }
  };

  const openDeleteUserDialog = (user: BackendUser) => {
    setSelectedUser(user);
    setDeleteUserDialog(true);
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchMatches();
      fetchUsers();
      if (tabValue === 3) {
        fetchWeeklyRankings();
      }
    }
  }, [user, tabValue]);

  if (!user?.isAdmin) {
    return (
      <Layout>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">
            Bu sayfaya erişim izniniz bulunmamaktadır.
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Admin Panel
          </Typography>

          <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tab label="Maç Yönetimi" />
            <Tab label="Kullanıcı Yönetimi" />
            <Tab label="İstatistikler" />
            <Tab label="Hafta Kontrolü" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Maçlar</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddMatchDialog(true)}
              >
                Yeni Maç Ekle
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>
                  {error}
                </Box>
                <Button onClick={fetchMatches} sx={{ ml: 2 }}>
                  Tekrar Dene
                </Button>
              </Alert>
            ) : (
              <ResponsiveTable minWidth={800}>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Maç</TableCell>
                      <TableCell>Lig</TableCell>
                      <TableCell>Tarih</TableCell>
                      <TableCell>Durum</TableCell>
                      <TableCell>Sonuç</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.id}</TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {match.home_team} vs {match.away_team}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={match.league} size="small" />
                        </TableCell>
                        <TableCell>{formatDate(match.match_date)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={match.status === 'completed' ? 'Bitti' : 'Aktif'} 
                            color={match.status === 'completed' ? 'success' : 'primary'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {getResultText(match)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {match.status === 'active' && (
                              <IconButton
                                color="primary"
                                onClick={() => {
                                  setSelectedMatch(match);
                                  setResultDialog(true);
                                }}
                                size="small"
                                title="Sonuç Belirle"
                              >
                                <Check />
                              </IconButton>
                            )}
                            <IconButton
                              color="error"
                              onClick={() => {
                                setSelectedMatch(match);
                                setDeleteDialog(true);
                              }}
                              size="small"
                              title="Maçı Sil"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </ResponsiveTable>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Kullanıcı Yönetimi
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchUsers} sx={{ ml: 2 }}>
                  Tekrar Dene
                </Button>
              </Alert>
            ) : (
              <ResponsiveTable minWidth={600}>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Kullanıcı Adı</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Rol</TableCell>
                      <TableCell>Puan</TableCell>
                      <TableCell>Kayıt Tarihi</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {user.username}
                          </Typography>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={user.role === 'admin' ? 'Admin' : 'Kullanıcı'} 
                            color={user.role === 'admin' ? 'error' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {user.points} puan
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>
                          {user.role !== 'admin' ? (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<Delete />}
                              onClick={() => openDeleteUserDialog(user)}
                              sx={{ minWidth: 'auto' }}
                            >
                              Sil
                            </Button>
                          ) : (
                            <Chip 
                              label="Korumalı" 
                              size="small" 
                              color="secondary" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
              </ResponsiveTable>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>İstatistikler</Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Card sx={{ flex: 1, minWidth: 200 }}>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    Toplam Maç
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {matches.length}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 200 }}>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    Aktif Maçlar
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {matches.filter(m => m.status === 'active').length}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 200 }}>
                <CardContent>
                  <Typography variant="h6" color="secondary">
                    Biten Maçlar
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {matches.filter(m => m.status === 'completed').length}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 200 }}>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    Toplam Kullanıcı
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                    {users.length}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>Haftalık Sıralamalar ve Ödül Sistemi</Typography>
            
            {/* Otomatik Haftalık Reset Sistemi Durumu */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">🤖 Otomatik Haftalık Reset Sistemi</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'success.main' }}></Box>
                  <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                    AKTİF
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  🤖 <strong>Sistem Durumu:</strong> Otomatik reset sistemi çalışıyor ve her Salı 03:00'da haftalık sıfırlama yapacak.
                </Typography>
              </Box>
              
              <Alert severity="success" sx={{ mt: 1 }}>
                <strong>🤖 Otomatik Sistem:</strong> Her Salı 03:00'da sistem otomatik olarak yeni hafta başlatır. 
                Geçen haftanın sıralama sonuçları hesaplanır ve tüm kullanıcı puanları sıfırlanır.
              </Alert>
              
              <Alert severity="info" sx={{ mt: 1 }}>
                <strong>🏆 Ödül Verme:</strong> Haftalık kazananlara ödül vermek için "Hafta Kontrolü" sekmesindeki 
                ilgili haftada bulunan "Ödül Ver" butonlarını kullanın.
              </Alert>
              
                              <Box sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    📅 <strong>Bir sonraki reset:</strong> Salı 03:00 (Türkiye saati)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⏰ <strong>Hafta döngüsü:</strong> Salı 03:00 - Salı 02:59
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    🏆 <strong>Ödül sistemi:</strong> Manuel (Admin tarafından verilir)
                  </Typography>
                </Box>
            </Paper>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Button onClick={fetchWeeklyRankings} sx={{ ml: 2 }}>
                  Tekrar Dene
                </Button>
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {weeklyRankings.map((week) => (
                  <Card key={week.week_start} elevation={2}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        📅 {week.week_label}
                      </Typography>
                      
                      {week.rankings.length > 0 ? (
                        <ResponsiveTable minWidth={700}>
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Sıra</strong></TableCell>
                                <TableCell><strong>Kullanıcı</strong></TableCell>
                                <TableCell><strong>Haftalık Puan</strong></TableCell>
                                <TableCell><strong>Doğru Tahmin</strong></TableCell>
                                <TableCell><strong>Toplam Tahmin</strong></TableCell>
                                <TableCell><strong>Durum</strong></TableCell>
                                <TableCell><strong>İşlem</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {week.rankings.slice(0, 3).map((user) => (
                                <TableRow key={user.id} sx={{ 
                                  backgroundColor: user.position === 1 ? '#fff9c4' : 
                                                   user.position === 2 ? '#f3e5f5' : 
                                                   user.position === 3 ? '#e8f5e8' : 'inherit'
                                }}>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{ fontSize: '1.5rem' }}>
                                        {user.position === 1 ? '🥇' : 
                                         user.position === 2 ? '🥈' : 
                                         user.position === 3 ? '🥉' : user.position}
                                      </Typography>
                                      <Typography variant="body2" fontWeight="bold">
                                        {user.position}.
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold">
                                      {user.username}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {user.email}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                                      {user.weekly_points}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" color="success.main">
                                      {user.correct_predictions}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {user.predictions_count}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {user.has_award ? (
                                      <Chip label="Ödül Verildi" color="success" size="small" />
                                    ) : (
                                      <Chip label="Beklemede" color="warning" size="small" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {!user.has_award && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                          setSelectedAwardUser({ user, week });
                                          setAwardDialog(true);
                                        }}
                                      >
                                        Ödül Ver
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                        </ResponsiveTable>
                      ) : (
                        <Alert severity="info" sx={{ mt: 2 }}>
                          Bu hafta için henüz tahmin yapılmamış.
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </TabPanel>

          {/* Add Match Dialog */}
          <Dialog open={addMatchDialog} onClose={() => setAddMatchDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Yeni Maç Ekle</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Ev Sahibi Takım"
                fullWidth
                variant="outlined"
                value={matchForm.home_team}
                onChange={(e) => setMatchForm({...matchForm, home_team: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Deplasman Takım"
                fullWidth
                variant="outlined"
                value={matchForm.away_team}
                onChange={(e) => setMatchForm({...matchForm, away_team: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Lig"
                fullWidth
                variant="outlined"
                value={matchForm.league}
                onChange={(e) => setMatchForm({...matchForm, league: e.target.value})}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Maç Tarihi"
                type="datetime-local"
                fullWidth
                variant="outlined"
                value={matchForm.match_date}
                onChange={(e) => setMatchForm({...matchForm, match_date: e.target.value})}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Puan Ayarları
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="dense"
                  label="Ev Sahibi Kazanırsa"
                  type="number"
                  variant="outlined"
                  value={matchForm.home_points}
                  onChange={(e) => setMatchForm({...matchForm, home_points: Number(e.target.value)})}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  margin="dense"
                  label="Deplasman Kazanırsa"
                  type="number"
                  variant="outlined"
                  value={matchForm.away_points}
                  onChange={(e) => setMatchForm({...matchForm, away_points: Number(e.target.value)})}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  margin="dense"
                  label="Beraberlik"
                  type="number"
                  variant="outlined"
                  value={matchForm.draw_points}
                  onChange={(e) => setMatchForm({...matchForm, draw_points: Number(e.target.value)})}
                  inputProps={{ min: 1, max: 100 }}
                  sx={{ flex: 1 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddMatchDialog(false)}>İptal</Button>
              <Button onClick={handleAddMatch} variant="contained">Ekle</Button>
            </DialogActions>
          </Dialog>

          {/* Result Dialog */}
          <Dialog open={resultDialog} onClose={() => setResultDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Maç Sonucu Belirle</DialogTitle>
            <DialogContent>
              {selectedMatch && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ textAlign: 'center', mb: 3 }}>
                    {selectedMatch.home_team} vs {selectedMatch.away_team}
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mb: 2, textAlign: 'center' }}>
                    Sonuç:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant={resultForm.selected_result === 'home' ? 'contained' : 'outlined'}
                      onClick={() => setResultForm({...resultForm, selected_result: 'home'})}
                      sx={{ flex: 1 }}
                    >
                      {selectedMatch.home_team}
                    </Button>
                    <Button
                      variant={resultForm.selected_result === 'draw' ? 'contained' : 'outlined'}
                      onClick={() => setResultForm({...resultForm, selected_result: 'draw'})}
                      sx={{ flex: 1 }}
                    >
                      Beraberlik
                    </Button>
                    <Button
                      variant={resultForm.selected_result === 'away' ? 'contained' : 'outlined'}
                      onClick={() => setResultForm({...resultForm, selected_result: 'away'})}
                      sx={{ flex: 1 }}
                    >
                      {selectedMatch.away_team}
                    </Button>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setResultDialog(false)}>İptal</Button>
              <Button onClick={handleSetResult} variant="contained">Kaydet</Button>
            </DialogActions>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Maçı Sil</DialogTitle>
            <DialogContent>
              {selectedMatch && (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>{selectedMatch.home_team} vs {selectedMatch.away_team}</strong> maçını silmek istediğinizden emin misiniz?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bu işlem geri alınamaz ve bu maça ait tüm tahminler de silinecektir.
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog(false)}>İptal</Button>
              <Button onClick={handleDeleteMatch} variant="contained" color="error">
                Sil
              </Button>
            </DialogActions>
          </Dialog>

          {/* Award Dialog */}
          <Dialog open={awardDialog} onClose={() => setAwardDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Ödül Ver</DialogTitle>
            <DialogContent>
              {selectedAwardUser && (
                <Box>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    <strong>{selectedAwardUser.user.username}</strong> kullanıcısına 
                    <strong> {selectedAwardUser.user.position}. sıra</strong> ödülü veriyorsunuz.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Hafta: {selectedAwardUser.week.week_label}
                  </Typography>
                  
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'info.dark' }}>🎁 Ödül Türleri:</Typography>
                    <Typography variant="body2" sx={{ color: 'info.dark' }}>
                      🏆 İndirim Kodları • 🎮 Oyun Kodları • 🛍️ Alışveriş Kuponları • 🎬 Eğlence Kodları
                    </Typography>
                  </Box>

                  <TextField
                    margin="dense"
                    label="Ödül Kodu (Zorunlu)"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={awardForm.reward_code}
                    onChange={(e) => setAwardForm({...awardForm, reward_code: e.target.value})}
                    placeholder="Örn: DISCOUNT50, GAME123, GIFT2024"
                    required
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    margin="dense"
                    label="Açıklama (İsteğe Bağlı)"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={awardForm.description}
                    onChange={(e) => setAwardForm({...awardForm, description: e.target.value})}
                    placeholder="Ödül hakkında açıklama: kodun geçerlilik süresi, kullanım koşulları, vb..."
                  />

                  {awardForm.reward_code && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ color: 'success.dark' }}>
                        <strong>🎁 Verilecek Ödül Kodu: </strong>
                        <Typography component="span" sx={{ fontFamily: 'monospace', bgcolor: 'white', px: 1, py: 0.5, borderRadius: 0.5 }}>
                          {awardForm.reward_code}
                        </Typography>
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAwardDialog(false)}>İptal</Button>
              <Button 
                onClick={handleGiveAward} 
                variant="contained" 
                color="primary"
                disabled={!awardForm.reward_code.trim()}
              >
                Ödül Ver
              </Button>
            </DialogActions>
          </Dialog>

          {/* Kullanıcı Silme Confirmation Dialog */}
          <Dialog open={deleteUserDialog} onClose={() => setDeleteUserDialog(false)}>
            <DialogTitle>
              <Typography variant="h6" color="error">
                ⚠️ Kullanıcı Silme Onayı
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>"{selectedUser?.username}"</strong> kullanıcısını silmek istediğinizden emin misiniz?
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Bu işlem geri alınamaz!</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Kullanıcı silindiğinde:
                </Typography>
                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                  <li>Tüm tahminleri silinecek</li>
                  <li>Kazandığı ödüller silinecek</li>
                  <li>Hesap kalıcı olarak kaldırılacak</li>
                </Box>
              </Alert>

              {selectedUser && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Kullanıcı Bilgileri:</strong>
                  </Typography>
                  <Typography variant="body2">
                    👤 Kullanıcı Adı: {selectedUser.username}
                  </Typography>
                  <Typography variant="body2">
                    📧 Email: {selectedUser.email}
                  </Typography>
                  <Typography variant="body2">
                    🏆 Puan: {selectedUser.points}
                  </Typography>
                  <Typography variant="body2">
                    📅 Kayıt: {formatDate(selectedUser.created_at)}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDeleteUserDialog(false)}
                variant="outlined"
              >
                İptal
              </Button>
              <Button 
                onClick={handleDeleteUser}
                variant="contained"
                color="error"
                startIcon={<Delete />}
              >
                Kullanıcıyı Sil
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Container>
    </Layout>
  );
};

export default AdminPanel; 