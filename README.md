# ⚽ Tahmin Uygulaması

Modern bir futbol maç tahmin uygulaması. Kullanıcılar maçlara tahmin yapabilir, puanlar kazanabilir ve haftalık sıralamalarda yarışabilir.

## 🎯 Özellikler

### 👤 Kullanıcı Özellikleri
- ✅ Kullanıcı kayıt/giriş sistemi
- ✅ Maçlara tahmin yapabilme
- ✅ Haftalık sıralama sistemi
- ✅ Kullanıcı profilleri ve istatistikler
- ✅ Profil yorumları
- ✅ Responsive tasarım

### ⚽ Maç ve Tahmin Sistemi
- ✅ Maç yönetimi (Admin)
- ✅ Tahmin deadline sistemi (10 dakika öncesi)
- ✅ Otomatik puanlama sistemi
- ✅ Haftalık reset (Her Salı 03:00)

### 🔐 Güvenlik
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Form validation (Frontend + Backend)
- ✅ Password hashing (bcrypt)

### 🎨 Arayüz
- ✅ Modern dark theme
- ✅ Material-UI components
- ✅ Toast notification sistemi
- ✅ Mobile responsive

## 🛠️ Teknolojiler

### Backend
- **Node.js** + **Express.js**
- **MySQL** (mysql2/promise)
- **JWT** authentication
- **bcrypt** password hashing
- **node-cron** for scheduled tasks

### Frontend
- **React** + **TypeScript**
- **Material-UI (MUI)**
- **React Router**
- **Context API** (AuthContext, ToastContext)

## 📦 Kurulum

### Gereksinimler
- Node.js (v16+)
- MySQL Server
- npm veya yarn

### Backend Kurulumu

```bash
cd backend
npm install
```

#### Environment Variables (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=tahmin_uygulamasi
JWT_SECRET=your_jwt_secret_key
PORT=5000
```

#### Database Setup
1. Create a new database in MySQL called `tahmin_uygulamasi`.
2. Import the tables and sample data by running the `backend/database-setup.sql` script. This will set up all the necessary tables and provide you with default admin and user accounts.

```bash
npm start
```

### Frontend Kurulumu

```bash
cd frontend
npm install
npm start
```

## 🚀 Kullanım

1. **Admin Hesabı**: `admin@tahmin.com` / `admin123`
2. **Test Kullanıcı**: `user@tahmin.com` / `user123`

### Admin Panel Özellikleri
- Maç ekleme/düzenleme/sonuç girme
- Kullanıcı yönetimi
- Haftalık sıralama kontrolü
- Ödül verme sistemi

### Kullanıcı Özellikleri
- Dashboard'da aktif maçları görme
- Tahmin yapma (deadline: maç başlamadan 10 dk önce)
- Profil görüntüleme ve düzenleme
- Haftalık sıralamaları takip etme

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi

### Matches
- `GET /api/matches` - Aktif maçlar
- `POST /api/matches` - Maç oluştur (Admin)
- `PUT /api/matches/:id/result` - Maç sonucu (Admin)

### Predictions
- `POST /api/predictions` - Tahmin yap
- `GET /api/predictions/user/:username` - Kullanıcı tahminleri

### Users
- `GET /api/users/leaderboard` - Haftalık sıralama
- `GET /api/users/profile/:username` - Kullanıcı profili

## 🔄 Haftalık Reset Sistemi

Uygulama her **Salı 03:00**'da otomatik olarak:
1. Geçen haftanın sıralamalarını hesaplar
2. Tüm kullanıcı puanlarını sıfırlar
3. Yeni hafta başlatır

## 🏆 Puanlama Sistemi

- **Doğru Tahmin**: Maç için belirlenen puan (varsayılan: 10-15 puan)
- **Yanlış Tahmin**: 0 puan
- **Haftalık Reset**: Her Salı puanlar sıfırlanır

## 📱 Mobile Support

Uygulama tam responsive tasarıma sahiptir:
- Mobile navigation drawer
- Responsive tables
- Touch-friendly UI elements

## 🔮 Gelecek Özellikler

- [ ] Email notifications
- [ ] Password reset
- [ ] Real-time updates (WebSocket)
- [ ] Search/Filter functions
- [ ] Theme toggle (Dark/Light)
- [ ] Admin analytics
- [ ] Performance optimizations

## 🤝 Katkıda Bulunma

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit'leyin (`git commit -m 'Add amazing feature'`)
4. Push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📧 İletişim

Proje Sahibi: [@reallifeinulas](https://github.com/reallifeinulas)

---

**⚽ İyi tahminler! 🎯**