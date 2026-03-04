<?php
// Migrate remaining tables: SavedAppIdea and AIMetadataOptimization

$CONFIG = [
    'sqlite_path' => __DIR__ . '/prisma/prisma/aso.db',
    'mysql_host' => '127.0.0.1',
    'mysql_port' => 3306,
    'mysql_db' => 'aso_keyword_tracker',
    'mysql_user' => 'aso_user',
    'mysql_pass' => 'aso_password123',
];

// Connect to SQLite
$sqlite = new PDO('sqlite:' . $CONFIG['sqlite_path']);
$sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Connect to MySQL
$mysql = new PDO(
    "mysql:host={$CONFIG['mysql_host']};port={$CONFIG['mysql_port']};dbname={$CONFIG['mysql_db']};charset=utf8mb4",
    $CONFIG['mysql_user'],
    $CONFIG['mysql_pass']
);
$mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$mysql->exec("SET FOREIGN_KEY_CHECKS = 0");

// Migrate SavedAppIdea
echo "Migrating SavedAppIdea...\n";
$stmt = $sqlite->query('SELECT * FROM "SavedAppIdea"');
$insert = $mysql->prepare("INSERT INTO SavedAppIdea (id, name, elevatorPitch, description, targetKeywords, uniqueSellingPoints, keyFeatures, targetAudience, estimatedDifficulty, category, sourceOpportunityId, savedAt, sessionId, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    try {
        $savedAt = date('Y-m-d H:i:s', $row['savedAt'] / 1000); // Convert from milliseconds
        $insert->execute([
            $row['id'], $row['name'], $row['elevatorPitch'], $row['description'],
            $row['targetKeywords'], $row['uniqueSellingPoints'], $row['keyFeatures'],
            $row['targetAudience'], $row['estimatedDifficulty'], $row['category'],
            $row['sourceOpportunityId'], $savedAt, $row['sessionId'], $row['notes']
        ]);
        $count++;
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
echo "Migrated $count SavedAppIdea rows\n";

// Migrate AIMetadataOptimization
echo "\nMigrating AIMetadataOptimization...\n";
$stmt = $sqlite->query('SELECT * FROM "AIMetadataOptimization"');
$insert = $mysql->prepare("INSERT INTO AIMetadataOptimization (id, appDescription, currentTitle, currentSubtitle, targetKeywords, country, optimizedTitle, titleCharCount, optimizedSubtitle, subtitleCharCount, keywordField, keywordCharCount, reasoning, generatedAt, sessionId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$count = 0;
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    try {
        $generatedAt = date('Y-m-d H:i:s', strtotime($row['generatedAt']));
        $insert->execute([
            $row['id'], $row['appDescription'], $row['currentTitle'], $row['currentSubtitle'],
            $row['targetKeywords'], $row['country'], $row['optimizedTitle'], $row['titleCharCount'],
            $row['optimizedSubtitle'], $row['subtitleCharCount'], $row['keywordField'],
            $row['keywordCharCount'], $row['reasoning'], $generatedAt, $row['sessionId']
        ]);
        $count++;
    } catch (PDOException $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
echo "Migrated $count AIMetadataOptimization rows\n";

$mysql->exec("SET FOREIGN_KEY_CHECKS = 1");
echo "\nMigration complete!\n";
