<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=aso_keyword_tracker;charset=utf8mb4', 'aso_user', 'aso_password123');
$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');
$pdo->exec('TRUNCATE TABLE SavedAppIdea');
$pdo->exec('TRUNCATE TABLE AIMetadataOptimization');
$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');
echo "Tables truncated\n";
