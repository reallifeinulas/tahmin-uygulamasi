-- Tahmin Uygulaması Database Setup

-- Kullanıcılar tablosu
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maçlar tablosu
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY AUTO_INCREMENT,
  home_team VARCHAR(100) NOT NULL,
  away_team VARCHAR(100) NOT NULL,
  match_date DATETIME NOT NULL,
  league VARCHAR(100) NOT NULL,
  status ENUM('active', 'completed') DEFAULT 'active',
  result ENUM('home', 'away', 'draw') NULL,
  home_points INT DEFAULT 10,
  away_points INT DEFAULT 10,
  draw_points INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tahminler tablosu
CREATE TABLE IF NOT EXISTS predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  match_id INT NOT NULL,
  selected_team ENUM('home', 'away', 'draw') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_match (user_id, match_id)
);

-- Ödüller tablosu
CREATE TABLE IF NOT EXISTS awards (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  position INT NOT NULL,
  points_earned INT NOT NULL,
  bonus_points INT DEFAULT 0,
  description VARCHAR(255),
  awarded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY unique_user_week_position (user_id, week_start, position)
);

-- Test kullanıcıları
INSERT IGNORE INTO users (username, email, password, role, points) VALUES
('admin', 'admin@tahmin.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 0),
('user', 'user@tahmin.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 0);

-- Test maçları
INSERT IGNORE INTO matches (home_team, away_team, match_date, league, home_points, away_points, draw_points) VALUES
('Galatasaray', 'Fenerbahçe', '2025-01-20 20:00:00', 'Süper Lig', 12, 12, 18),
('Beşiktaş', 'Trabzonspor', '2025-01-21 19:00:00', 'Süper Lig', 10, 10, 15),
('Real Madrid', 'Barcelona', '2025-01-22 21:30:00', 'La Liga', 15, 15, 20); 