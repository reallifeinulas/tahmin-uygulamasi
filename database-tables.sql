-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS tahmin_uygulamasi;
USE tahmin_uygulamasi;

-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    points INT DEFAULT 0,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Matches tablosu
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    home_team VARCHAR(255) NOT NULL,
    away_team VARCHAR(255) NOT NULL,
    match_date DATETIME NOT NULL,
    league VARCHAR(255) DEFAULT 'Süper Lig',
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    home_score INT DEFAULT NULL,
    away_score INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Predictions tablosu
CREATE TABLE IF NOT EXISTS predictions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    match_id INT NOT NULL,
    home_score INT NOT NULL,
    away_score INT NOT NULL,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_match (user_id, match_id)
);

-- Örnek veriler
INSERT INTO users (username, email, password, role) VALUES
('admin', 'admin@tahmin.com', '$2b$10$8K1p/a0dCVTrqLEoqQbm1.dODj4/iMq3kGFjKrJSdYkxlVF3rJhqu', 'admin'),
('testuser', 'user@tahmin.com', '$2b$10$8K1p/a0dCVTrqLEoqQbm1.dODj4/iMq3kGFjKrJSdYkxlVF3rJhqu', 'user');

INSERT INTO matches (home_team, away_team, match_date, league, status) VALUES
('Galatasaray', 'Fenerbahçe', '2024-12-20 19:00:00', 'Süper Lig', 'active'),
('Beşiktaş', 'Trabzonspor', '2024-12-21 16:00:00', 'Süper Lig', 'active'),
('Barcelona', 'Real Madrid', '2024-12-22 21:00:00', 'La Liga', 'active');

-- Şifreler: admin123 ve user123 