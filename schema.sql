-- ============================================
-- Rugby Analytics Ecosystem - Database Schema
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS rugby_control
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE rugby_control;

-- ============================================
-- Core Tables
-- ============================================

-- Teams (Equipes)
CREATE TABLE teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL CHARACTER SET utf8mb4,
    short_name VARCHAR(3) NOT NULL CHARACTER SET utf8mb4,
    club_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Users (Usuários do Sistema)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL CHARACTER SET utf8mb4,
    role ENUM('referee', 'analyst', 'evaluator', 'admin') NOT NULL DEFAULT 'analyst',
    team_id INT,
    club_affiliation VARCHAR(100) CHARACTER SET utf8mb4,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    INDEX (role),
    INDEX (email)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Competitions (Competições)
CREATE TABLE competitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHARACTER SET utf8mb4,
    year INT NOT NULL,
    league_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Matches (Partidas)
CREATE TABLE matches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_uuid VARCHAR(36) UNIQUE NOT NULL,
    competition_id INT,
    home_team_id INT NOT NULL,
    away_team_id INT NOT NULL,
    match_date DATETIME,
    status ENUM('setup', 'live', 'finished', 'consolidated') NOT NULL DEFAULT 'setup',
    referee_id INT NOT NULL,
    evaluator_id INT,
    match_data JSON,
    ai_analysis JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    evaluated_at TIMESTAMP NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id),
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id),
    FOREIGN KEY (referee_id) REFERENCES users(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    INDEX (status),
    INDEX (referee_id),
    INDEX (match_date)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Match Events (Eventos da Partida - Timeline)
CREATE TABLE match_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_uuid VARCHAR(36) UNIQUE NOT NULL,
    match_id INT NOT NULL,
    event_type ENUM('penalty', 'scrum', 'lineout', 'maul', 'try', 'card', 'substitution', 'conversion', 'drop_goal', 'ruck', 'tackle') NOT NULL,
    team VARCHAR(1) NOT NULL,
    player_number VARCHAR(50),
    game_time TIME,
    timestamp_exact DATETIME NOT NULL,
    referee_comment TEXT CHARACTER SET utf8mb4,
    evaluator_comment TEXT CHARACTER SET utf8mb4,
    evaluator_feedback ENUM('no_detect', 'error', 'doubt', 'good', 'team_three'),
    high_impact BOOLEAN DEFAULT FALSE,
    card_type ENUM('yellow', 'red_20', 'red_permanent'),
    field_zone VARCHAR(50) CHARACTER SET utf8mb4,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX (match_id),
    INDEX (match_id, team, event_type),
    INDEX (event_type),
    INDEX (created_at)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Team Statistics (Estatísticas por Time)
CREATE TABLE team_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL,
    team VARCHAR(1) NOT NULL,
    total_actions INT DEFAULT 0,
    scrums_won INT DEFAULT 0,
    lineouts_won INT DEFAULT 0,
    mauls_won INT DEFAULT 0,
    turnovers INT DEFAULT 0,
    tackles INT DEFAULT 0,
    carries INT DEFAULT 0,
    penalties_conceded INT DEFAULT 0,
    cards_received INT DEFAULT 0,
    points_estimated INT DEFAULT 0,
    possession_pct DECIMAL(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    UNIQUE KEY (match_id, team),
    INDEX (match_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Match Evaluations (Avaliações Pós-Jogo - 14 Rubros)
CREATE TABLE match_evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    match_id INT NOT NULL UNIQUE,
    evaluator_id INT NOT NULL,

    -- 14 Rubros de Avaliação
    q1_score INT CHECK (q1_score >= 1 AND q1_score <= 10),
    q1_comment TEXT CHARACTER SET utf8mb4,
    q2_score INT CHECK (q2_score >= 1 AND q2_score <= 10),
    q2_comment TEXT CHARACTER SET utf8mb4,
    q3_score INT CHECK (q3_score >= 1 AND q3_score <= 10),
    q3_comment TEXT CHARACTER SET utf8mb4,
    q4_score INT CHECK (q4_score >= 1 AND q4_score <= 10),
    q4_comment TEXT CHARACTER SET utf8mb4,
    q5_score INT CHECK (q5_score >= 1 AND q5_score <= 10),
    q5_comment TEXT CHARACTER SET utf8mb4,
    q6_score INT CHECK (q6_score >= 1 AND q6_score <= 10),
    q6_comment TEXT CHARACTER SET utf8mb4,
    q7_score INT CHECK (q7_score >= 1 AND q7_score <= 10),
    q7_comment TEXT CHARACTER SET utf8mb4,
    q8_score INT CHECK (q8_score >= 1 AND q8_score <= 10),
    q8_comment TEXT CHARACTER SET utf8mb4,
    q9_score INT CHECK (q9_score >= 1 AND q9_score <= 10),
    q9_comment TEXT CHARACTER SET utf8mb4,
    q10_score INT CHECK (q10_score >= 1 AND q10_score <= 10),
    q10_comment TEXT CHARACTER SET utf8mb4,
    q11_score INT CHECK (q11_score >= 1 AND q11_score <= 10),
    q11_comment TEXT CHARACTER SET utf8mb4,
    q12_score INT CHECK (q12_score >= 1 AND q12_score <= 10),
    q12_comment TEXT CHARACTER SET utf8mb4,
    q13_score INT CHECK (q13_score >= 1 AND q13_score <= 10),
    q13_comment TEXT CHARACTER SET utf8mb4,
    q14_score INT CHECK (q14_score >= 1 AND q14_score <= 10),
    q14_comment TEXT CHARACTER SET utf8mb4,

    closing_feedback TEXT CHARACTER SET utf8mb4,

    average_score DECIMAL(3,1) GENERATED ALWAYS AS
        ((q1_score+q2_score+q3_score+q4_score+q5_score+q6_score+q7_score+q8_score+q9_score+q10_score+q11_score+q12_score+q13_score+q14_score)/14) STORED,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    INDEX (match_id),
    INDEX (evaluator_id)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- Sample Data
-- ============================================

-- Insert Teams
INSERT INTO teams (team_name, short_name) VALUES
('Jacareí Rugby', 'JAC'),
('Iguanas Rugby Club', 'IGU');

-- Insert Competitions
INSERT INTO competitions (name, year, league_id) VALUES
('Super 12 2026', 2026, 1),
('Série A - M16', 2026, 2),
('Série B - Feminino', 2026, 3);

-- Insert Users
-- Password hashes are for "password123" - in production use bcrypt
INSERT INTO users (email, password_hash, full_name, role, team_id, club_affiliation, is_active) VALUES
('referee@club.com', '$2a$10$placeholder', 'João Pereira', 'referee', NULL, 'Super 12', 1),
('analyst-a@club.com', '$2a$10$placeholder', 'Silva Time A', 'analyst', 1, 'Jacareí', 1),
('analyst-b@club.com', '$2a$10$placeholder', 'Santos Time B', 'analyst', 2, 'Iguanas', 1),
('evaluator@club.com', '$2a$10$placeholder', 'Carlos Coach', 'evaluator', NULL, 'Super 12', 1),
('admin@club.com', '$2a$10$placeholder', 'Admin User', 'admin', NULL, 'Super 12', 1);

-- Insert Sample Match
INSERT INTO matches (match_uuid, competition_id, home_team_id, away_team_id, match_date, status, referee_id, evaluator_id)
VALUES (
    UUID(),
    1,
    1,
    2,
    '2026-03-20 14:00:00',
    'setup',
    1,
    4
);

-- ============================================
-- Indexes and Performance Optimization
-- ============================================

-- Create indexes for common queries
CREATE INDEX idx_matches_status_date ON matches(status, match_date);
CREATE INDEX idx_matches_referee ON matches(referee_id);
CREATE INDEX idx_matches_evaluator ON matches(evaluator_id);
CREATE INDEX idx_events_match_time ON match_events(match_id, game_time);
CREATE INDEX idx_events_type ON match_events(event_type);
CREATE INDEX idx_team_stats_match ON team_stats(match_id);
CREATE INDEX idx_evaluations_evaluator ON match_evaluations(evaluator_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- Views for Easy Querying
-- ============================================

-- View: Consolidated Match Data
CREATE OR REPLACE VIEW v_match_summary AS
SELECT
    m.id,
    m.match_uuid,
    c.name AS competition,
    ht.team_name AS home_team,
    at.team_name AS away_team,
    m.match_date,
    m.status,
    ur.full_name AS referee_name,
    ue.full_name AS evaluator_name,
    (SELECT COUNT(*) FROM match_events WHERE match_id = m.id) AS event_count,
    (SELECT average_score FROM match_evaluations WHERE match_id = m.id) AS evaluation_score
FROM matches m
LEFT JOIN competitions c ON m.competition_id = c.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN users ur ON m.referee_id = ur.id
LEFT JOIN users ue ON m.evaluator_id = ue.id;

-- View: Events with Team Names
CREATE OR REPLACE VIEW v_events_detailed AS
SELECT
    me.id,
    me.event_uuid,
    me.match_id,
    CASE WHEN me.team = 'A' THEN m.home_team_id ELSE m.away_team_id END AS team_id,
    CASE WHEN me.team = 'A' THEN ht.team_name ELSE at.team_name END AS team_name,
    me.event_type,
    me.player_number,
    me.game_time,
    me.timestamp_exact,
    me.referee_comment,
    me.high_impact,
    me.card_type,
    u.full_name AS created_by_name
FROM match_events me
LEFT JOIN matches m ON me.match_id = m.id
LEFT JOIN teams ht ON m.home_team_id = ht.id
LEFT JOIN teams at ON m.away_team_id = at.id
LEFT JOIN users u ON me.created_by = u.id;

-- ============================================
-- Triggers (Optional - for audit trail)
-- ============================================

-- Trigger to update match status to 'consolidated' when evaluation is submitted
DELIMITER $$
CREATE TRIGGER tr_evaluation_completion
AFTER INSERT ON match_evaluations
FOR EACH ROW
BEGIN
    UPDATE matches
    SET status = 'consolidated', evaluated_at = NOW()
    WHERE id = NEW.match_id;
END$$
DELIMITER ;

-- ============================================
-- End of Schema
-- ============================================
