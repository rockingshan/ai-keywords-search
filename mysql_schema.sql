-- =====================================================
-- ASO Keyword Tracker - MySQL Database Schema
-- =====================================================

-- Drop database if exists (optional - uncomment if needed)
-- DROP DATABASE IF EXISTS aso_keyword_tracker;

-- Create database
CREATE DATABASE IF NOT EXISTS aso_keyword_tracker
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE aso_keyword_tracker;

-- =====================================================
-- Create User with Privileges
-- =====================================================

-- Drop user if exists to avoid errors
DROP USER IF EXISTS 'aso_user'@'localhost';
DROP USER IF EXISTS 'aso_user'@'%';

-- Create user for localhost
CREATE USER 'aso_user'@'localhost' IDENTIFIED BY 'aso_password123';
GRANT ALL PRIVILEGES ON aso_keyword_tracker.* TO 'aso_user'@'localhost';

-- Create user for any host (useful for remote connections)
CREATE USER 'aso_user'@'%' IDENTIFIED BY 'aso_password123';
GRANT ALL PRIVILEGES ON aso_keyword_tracker.* TO 'aso_user'@'%';

-- Apply privilege changes
FLUSH PRIVILEGES;

-- =====================================================
-- Table 1: keyword_analysis - Historical keyword metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS keyword_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    popularity INT DEFAULT 0,
    difficulty INT DEFAULT 0,
    competitor_count INT DEFAULT 0,
    top_apps JSON,
    related_terms JSON,
    analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    INDEX idx_keyword_country (keyword, country),
    INDEX idx_analyzed_at (analyzed_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 2: ranking_history - App ranking positions
-- =====================================================
CREATE TABLE IF NOT EXISTS ranking_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_id VARCHAR(50) NOT NULL,
    app_name VARCHAR(255),
    keyword VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    `rank` INT DEFAULT 0,
    is_ranking BOOLEAN DEFAULT FALSE,
    total_results INT DEFAULT 0,
    top_competitors JSON,
    tracked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_app_id (app_id),
    INDEX idx_keyword_country (keyword, country),
    INDEX idx_tracked_at (tracked_at),
    INDEX idx_app_keyword (app_id, keyword, country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 3: apps - Cached app information
-- =====================================================
CREATE TABLE IF NOT EXISTS apps (
    id VARCHAR(50) PRIMARY KEY,
    bundle_id VARCHAR(255),
    name VARCHAR(255),
    developer VARCHAR(255),
    developer_id VARCHAR(50),
    icon TEXT,
    category VARCHAR(100),
    rating DECIMAL(3,2),
    rating_count INT DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    release_date DATETIME,
    last_updated DATETIME,
    INDEX idx_bundle_id (bundle_id),
    INDEX idx_category (category),
    INDEX idx_name (name),
    INDEX idx_developer (developer)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 4: tracked_keywords - User tracked keywords
-- =====================================================
CREATE TABLE IF NOT EXISTS tracked_keywords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    popularity INT DEFAULT 0,
    difficulty INT DEFAULT 0,
    opportunity_score DECIMAL(5,2),
    competitor_count INT DEFAULT 0,
    tracked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    notes TEXT,
    INDEX idx_keyword_country (keyword, country),
    INDEX idx_tracked_at (tracked_at),
    INDEX idx_session_id (session_id),
    INDEX idx_opportunity_score (opportunity_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 5: ai_keyword_suggestions - AI generated suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_keyword_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_description TEXT,
    category VARCHAR(100),
    target_audience VARCHAR(255),
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    suggestions JSON,
    model VARCHAR(50),
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    INDEX idx_category (category),
    INDEX idx_generated_at (generated_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 6: ai_competitor_analysis - Competitor gap analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_competitor_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    main_app_id VARCHAR(50) NOT NULL,
    competitor_ids JSON,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    missing_keywords JSON,
    keyword_gaps JSON,
    keywords_to_avoid JSON,
    recommendations JSON,
    analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    INDEX idx_main_app_id (main_app_id),
    INDEX idx_analyzed_at (analyzed_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 7: ai_metadata_optimization - Optimized metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_metadata_optimization (
    id INT AUTO_INCREMENT PRIMARY KEY,
    app_description TEXT,
    current_title VARCHAR(255),
    current_subtitle VARCHAR(255),
    target_keywords JSON,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    optimized_title VARCHAR(255),
    title_char_count INT,
    optimized_subtitle VARCHAR(255),
    subtitle_char_count INT,
    keyword_field TEXT,
    keyword_char_count INT,
    reasoning TEXT,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    INDEX idx_country (country),
    INDEX idx_generated_at (generated_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 8: ai_intent_analysis - Keyword intent categorization
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_intent_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    keywords JSON,
    analysis JSON,
    analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    INDEX idx_analyzed_at (analyzed_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 9: keyword_search_jobs - Continuous search jobs
-- =====================================================
CREATE TABLE IF NOT EXISTS keyword_search_jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    searches_per_batch INT DEFAULT 10,
    interval_minutes INT DEFAULT 60,
    total_cycles INT DEFAULT 1,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    status VARCHAR(20) DEFAULT 'pending',
    current_cycle INT DEFAULT 0,
    total_keywords INT DEFAULT 0,
    strategy VARCHAR(20),
    seed_category VARCHAR(100),
    used_keywords JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME,
    completed_at DATETIME,
    last_run_at DATETIME,
    session_id VARCHAR(100),
    notes TEXT,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_session_id (session_id),
    INDEX idx_name (name),
    INDEX idx_strategy (strategy),
    INDEX idx_seed_category (seed_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 10: keyword_search_results - Job execution results
-- =====================================================
CREATE TABLE IF NOT EXISTS keyword_search_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    cycle_number INT DEFAULT 1,
    popularity INT DEFAULT 0,
    difficulty INT DEFAULT 0,
    competitor_count INT DEFAULT 0,
    opportunity_score DECIMAL(5,2),
    top_apps JSON,
    related_terms JSON,
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    searched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_tracked BOOLEAN DEFAULT FALSE,
    INDEX idx_job_id (job_id),
    INDEX idx_keyword (keyword),
    INDEX idx_cycle_number (cycle_number),
    INDEX idx_searched_at (searched_at),
    INDEX idx_status (status),
    INDEX idx_is_tracked (is_tracked),
    FOREIGN KEY (job_id) REFERENCES keyword_search_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 11: opportunity_discoveries - Category opportunities
-- =====================================================
CREATE TABLE IF NOT EXISTS opportunity_discoveries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100),
    target_audience VARCHAR(255),
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    keywords JSON,
    top_opportunities JSON,
    app_ideas JSON,
    filters JSON,
    discovered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    INDEX idx_category (category),
    INDEX idx_country (country),
    INDEX idx_discovered_at (discovered_at),
    INDEX idx_session_id (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 12: saved_app_ideas - User saved app concepts
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_app_ideas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    elevator_pitch TEXT,
    description TEXT,
    target_keywords JSON,
    unique_selling_points JSON,
    key_features JSON,
    target_audience VARCHAR(255),
    estimated_difficulty VARCHAR(20),
    category VARCHAR(100),
    source_opportunity_id INT,
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100),
    notes TEXT,
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_saved_at (saved_at),
    INDEX idx_session_id (session_id),
    INDEX idx_source_opportunity (source_opportunity_id),
    FOREIGN KEY (source_opportunity_id) REFERENCES opportunity_discoveries(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 13: saved_searches - User saved searches
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_searches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    config JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_checked DATETIME,
    alert_enabled BOOLEAN DEFAULT FALSE,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at),
    INDEX idx_alert_enabled (alert_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 14: search_history - API request analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    query_params JSON,
    body JSON,
    status_code INT,
    duration_ms INT,
    cached BOOLEAN DEFAULT FALSE,
    response_preview JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(100),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_endpoint (endpoint),
    INDEX idx_method (method),
    INDEX idx_status_code (status_code),
    INDEX idx_cached (cached),
    INDEX idx_session_id (session_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table 15: translation_cache - Translation cache
-- =====================================================
CREATE TABLE IF NOT EXISTS translation_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_lang VARCHAR(10) NOT NULL DEFAULT 'auto',
    target_lang VARCHAR(10) NOT NULL,
    translated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    service VARCHAR(50),
    INDEX idx_source_target_lang (source_lang, target_lang),
    INDEX idx_translated_at (translated_at),
    INDEX idx_service (service),
    FULLTEXT idx_original_text (original_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Additional Performance Indexes
-- =====================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_keyword_analysis_lookup ON keyword_analysis(keyword, country, analyzed_at);
CREATE INDEX idx_tracked_keywords_lookup ON tracked_keywords(keyword, country, tracked_at);
CREATE INDEX idx_ranking_history_lookup ON ranking_history(app_id, keyword, country, tracked_at);
CREATE INDEX idx_search_results_job_lookup ON keyword_search_results(job_id, cycle_number, status);

-- =====================================================
-- Schema Creation Complete
-- =====================================================
SELECT 'ASO Keyword Tracker database schema created successfully!' AS message;
