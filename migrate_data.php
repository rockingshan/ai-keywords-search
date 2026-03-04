<?php
/**
 * SQLite to MySQL Migration Script
 * ASO Keyword Tracker Database Migration
 * 
 * Source: SQLite (prisma/prisma/aso.db)
 * Target: MySQL (127.0.0.1:3306/aso_keyword_tracker)
 */

// Configuration
$CONFIG = [
    'sqlite_path' => __DIR__ . '/prisma/prisma/aso.db',
    'mysql_host' => '127.0.0.1',
    'mysql_port' => 3306,
    'mysql_db' => 'aso_keyword_tracker',
    'mysql_user' => 'aso_user',
    'mysql_pass' => 'aso_password123',
];

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', '1');

// Colors for terminal output
class Colors {
    const GREEN = "\033[32m";
    const RED = "\033[31m";
    const YELLOW = "\033[33m";
    const BLUE = "\033[34m";
    const CYAN = "\033[36m";
    const RESET = "\033[0m";
}

function log_info($message) {
    echo Colors::BLUE . "[INFO] " . Colors::RESET . $message . PHP_EOL;
}

function log_success($message) {
    echo Colors::GREEN . "[SUCCESS] " . Colors::RESET . $message . PHP_EOL;
}

function log_error($message) {
    echo Colors::RED . "[ERROR] " . Colors::RESET . $message . PHP_EOL;
}

function log_warn($message) {
    echo Colors::YELLOW . "[WARN] " . Colors::RESET . $message . PHP_EOL;
}

function log_progress($table, $current, $total) {
    $percent = $total > 0 ? round(($current / $total) * 100, 1) : 100;
    echo "\r" . Colors::CYAN . "[PROGRESS] " . Colors::RESET . "{$table}: {$current}/{$total} ({$percent}%)";
    if ($current >= $total) {
        echo PHP_EOL;
    }
}

// Check if SQLite extension is available
if (!extension_loaded('pdo_sqlite')) {
    log_error("PDO SQLite extension is not loaded!");
    exit(1);
}

if (!extension_loaded('pdo_mysql')) {
    log_error("PDO MySQL extension is not loaded!");
    exit(1);
}

// Check SQLite file exists
if (!file_exists($CONFIG['sqlite_path'])) {
    log_error("SQLite database not found at: {$CONFIG['sqlite_path']}");
    exit(1);
}

log_info("Starting migration from SQLite to MySQL...");
log_info("SQLite source: {$CONFIG['sqlite_path']}");
log_info("MySQL target: {$CONFIG['mysql_host']}:{$CONFIG['mysql_port']}/{$CONFIG['mysql_db']}");

try {
    // Connect to SQLite
    $sqlite = new PDO('sqlite:' . $CONFIG['sqlite_path']);
    $sqlite->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $sqlite->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    log_success("Connected to SQLite database");
    
    // Connect to MySQL
    $mysql = new PDO(
        "mysql:host={$CONFIG['mysql_host']};port={$CONFIG['mysql_port']};dbname={$CONFIG['mysql_db']};charset=utf8mb4",
        $CONFIG['mysql_user'],
        $CONFIG['mysql_pass'],
        [PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"]
    );
    $mysql->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $mysql->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
    log_success("Connected to MySQL database");
    
    // Disable foreign key checks temporarily for faster inserts
    $mysql->exec("SET FOREIGN_KEY_CHECKS = 0");
    
} catch (PDOException $e) {
    log_error("Database connection failed: " . $e->getMessage());
    exit(1);
}

/**
 * Table mapping configuration
 * Order matters for foreign key dependencies!
 * Parent tables must come before child tables.
 */
$TABLES = [
    // Level 1: No foreign key dependencies
    [
        'name' => 'App',
        'mysql_table' => 'App',
        'columns' => ['id', 'bundleId', 'name', 'developer', 'developerId', 'icon', 'category', 'rating', 'ratingCount', 'price', 'currency', 'description', 'releaseDate', 'lastUpdated'],
        'types' => [
            'rating' => 'float',
            'price' => 'float',
            'lastUpdated' => 'datetime'
        ]
    ],
    [
        'name' => 'KeywordAnalysis',
        'mysql_table' => 'KeywordAnalysis',
        'columns' => ['id', 'keyword', 'country', 'popularity', 'difficulty', 'competitorCount', 'topApps', 'relatedTerms', 'analyzedAt', 'sessionId'],
        'types' => [
            'popularity' => 'int',
            'difficulty' => 'int',
            'competitorCount' => 'int',
            'analyzedAt' => 'datetime'
        ]
    ],
    [
        'name' => 'TrackedKeyword',
        'mysql_table' => 'TrackedKeyword',
        'columns' => ['id', 'keyword', 'country', 'popularity', 'difficulty', 'opportunityScore', 'competitorCount', 'trackedAt', 'sessionId', 'notes'],
        'types' => [
            'popularity' => 'int',
            'difficulty' => 'int',
            'opportunityScore' => 'int',
            'competitorCount' => 'int',
            'trackedAt' => 'datetime'
        ],
        'unique_check' => ['keyword', 'country', 'sessionId']
    ],
    [
        'name' => 'SavedSearch',
        'mysql_table' => 'SavedSearch',
        'columns' => ['id', 'userId', 'name', 'type', 'config', 'createdAt', 'lastChecked', 'alertEnabled'],
        'types' => [
            'createdAt' => 'datetime',
            'lastChecked' => 'datetime',
            'alertEnabled' => 'bool'
        ]
    ],
    [
        'name' => 'SearchHistory',
        'mysql_table' => 'SearchHistory',
        'columns' => ['id', 'endpoint', 'method', 'query', 'body', 'statusCode', 'duration', 'cached', 'response', 'ipAddress', 'userAgent', 'sessionId', 'timestamp'],
        'types' => [
            'statusCode' => 'int',
            'duration' => 'int',
            'cached' => 'bool',
            'timestamp' => 'datetime'
        ]
    ],
    [
        'name' => 'TranslationCache',
        'mysql_table' => 'TranslationCache',
        'columns' => ['id', 'originalText', 'translatedText', 'sourceLang', 'targetLang', 'translatedAt', 'service'],
        'types' => [
            'translatedAt' => 'datetime'
        ],
        'unique_check' => ['originalText', 'sourceLang', 'targetLang']
    ],
    [
        'name' => 'SavedAppIdea',
        'mysql_table' => 'SavedAppIdea',
        'columns' => ['id', 'name', 'elevatorPitch', 'description', 'targetKeywords', 'uniqueSellingPoints', 'keyFeatures', 'targetAudience', 'estimatedDifficulty', 'category', 'sourceOpportunityId', 'savedAt', 'sessionId', 'notes'],
        'types' => [
            'savedAt' => 'datetime'
        ]
    ],
    [
        'name' => 'KeywordSearchJob',
        'mysql_table' => 'KeywordSearchJob',
        'columns' => ['id', 'name', 'searchesPerBatch', 'intervalMinutes', 'totalCycles', 'country', 'status', 'currentCycle', 'totalKeywords', 'strategy', 'seedCategory', 'usedKeywords', 'createdAt', 'startedAt', 'completedAt', 'lastRunAt', 'sessionId', 'notes'],
        'types' => [
            'searchesPerBatch' => 'int',
            'intervalMinutes' => 'int',
            'totalCycles' => 'int',
            'currentCycle' => 'int',
            'totalKeywords' => 'int',
            'createdAt' => 'datetime',
            'startedAt' => 'datetime',
            'completedAt' => 'datetime',
            'lastRunAt' => 'datetime'
        ]
    ],
    [
        'name' => 'OpportunityDiscovery',
        'mysql_table' => 'OpportunityDiscovery',
        'columns' => ['id', 'category', 'targetAudience', 'country', 'keywords', 'topOpportunities', 'appIdeas', 'filters', 'discoveredAt', 'sessionId'],
        'types' => [
            'discoveredAt' => 'datetime'
        ]
    ],
    [
        'name' => 'AIKeywordSuggestion',
        'mysql_table' => 'AIKeywordSuggestion',
        'columns' => ['id', 'appDescription', 'category', 'targetAudience', 'country', 'suggestions', 'model', 'generatedAt', 'sessionId'],
        'types' => [
            'generatedAt' => 'datetime'
        ]
    ],
    [
        'name' => 'AIMetadataOptimization',
        'mysql_table' => 'AIMetadataOptimization',
        'columns' => ['id', 'appDescription', 'currentTitle', 'currentSubtitle', 'targetKeywords', 'country', 'optimizedTitle', 'titleCharCount', 'optimizedSubtitle', 'subtitleCharCount', 'keywordField', 'keywordCharCount', 'reasoning', 'generatedAt', 'sessionId'],
        'types' => [
            'titleCharCount' => 'int',
            'subtitleCharCount' => 'int',
            'keywordCharCount' => 'int',
            'generatedAt' => 'datetime'
        ]
    ],
    [
        'name' => 'AIIntentAnalysis',
        'mysql_table' => 'AIIntentAnalysis',
        'columns' => ['id', 'keywords', 'analysis', 'analyzedAt', 'sessionId'],
        'types' => [
            'analyzedAt' => 'datetime'
        ]
    ],
    
    // Level 2: Tables with foreign keys to Level 1 tables
    [
        'name' => 'RankingHistory',
        'mysql_table' => 'RankingHistory',
        'columns' => ['id', 'appId', 'appName', 'keyword', 'country', 'rank', 'isRanking', 'totalResults', 'topCompetitors', 'trackedAt'],
        'types' => [
            'rank' => 'int',
            'isRanking' => 'bool',
            'totalResults' => 'int',
            'trackedAt' => 'datetime'
        ]
    ],
    [
        'name' => 'AICompetitorAnalysis',
        'mysql_table' => 'AICompetitorAnalysis',
        'columns' => ['id', 'mainAppId', 'competitorIds', 'country', 'missingKeywords', 'keywordGaps', 'keywordsToAvoid', 'recommendations', 'analyzedAt', 'sessionId'],
        'types' => [
            'analyzedAt' => 'datetime'
        ]
    ],
    [
        'name' => 'KeywordSearchResult',
        'mysql_table' => 'KeywordSearchResult',
        'columns' => ['id', 'jobId', 'keyword', 'cycleNumber', 'popularity', 'difficulty', 'competitorCount', 'opportunityScore', 'topApps', 'relatedTerms', 'status', 'errorMessage', 'searchedAt', 'isTracked'],
        'types' => [
            'cycleNumber' => 'int',
            'popularity' => 'int',
            'difficulty' => 'int',
            'competitorCount' => 'int',
            'opportunityScore' => 'float',
            'searchedAt' => 'datetime',
            'isTracked' => 'bool'
        ]
    ],
];

/**
 * Convert value based on type
 */
function convertValue($value, $type) {
    if ($value === null) {
        return null;
    }
    
    switch ($type) {
        case 'int':
            return (int) $value;
        case 'float':
            return (float) $value;
        case 'bool':
            return (bool) $value ? 1 : 0;
        case 'datetime':
            // Handle invalid datetime values from SQLite
            if (is_numeric($value)) {
                // Unix timestamp - check if reasonable
                if ($value < 0 || $value > 4102444800) { // Max reasonable timestamp (year 2100)
                    return date('Y-m-d H:i:s'); // Use current time as fallback
                }
                return date('Y-m-d H:i:s', (int)$value);
            }
            // SQLite returns datetime as string, check if valid
            $dt = strtotime($value);
            if ($dt !== false) {
                $year = (int)date('Y', $dt);
                // MySQL DATETIME only supports years 1000-9999
                if ($year < 1000 || $year > 9999) {
                    return date('Y-m-d H:i:s'); // Use current time as fallback
                }
                return date('Y-m-d H:i:s', $dt);
            }
            return date('Y-m-d H:i:s'); // Use current time as fallback
        default:
            return $value;
    }
}

/**
 * Check if record exists in MySQL (for duplicate prevention)
 */
function recordExists($mysql, $table, $uniqueFields, $data) {
    if (empty($uniqueFields)) {
        // Check by primary key (id)
        $stmt = $mysql->prepare("SELECT COUNT(*) FROM `{$table}` WHERE id = ?");
        $stmt->execute([$data['id']]);
        return $stmt->fetchColumn() > 0;
    }
    
    $conditions = [];
    $values = [];
    foreach ($uniqueFields as $field) {
        $conditions[] = "`{$field}` = ?";
        $values[] = $data[$field] ?? null;
    }
    
    $sql = "SELECT COUNT(*) FROM `{$table}` WHERE " . implode(' AND ', $conditions);
    $stmt = $mysql->prepare($sql);
    $stmt->execute($values);
    return $stmt->fetchColumn() > 0;
}

/**
 * Migrate a single table
 */
function migrateTable($sqlite, $mysql, $config) {
    $tableName = $config['name'];
    $mysqlTable = $config['mysql_table'];
    $columns = $config['columns'];
    $types = $config['types'] ?? [];
    $uniqueCheck = $config['unique_check'] ?? null;
    
    echo PHP_EOL;
    log_info("Migrating table: {$tableName} -> {$mysqlTable}");
    
    // Get count from SQLite
    $countStmt = $sqlite->query("SELECT COUNT(*) FROM \"{$tableName}\"");
    $totalCount = $countStmt->fetchColumn();
    
    if ($totalCount == 0) {
        log_warn("Table {$tableName} is empty, skipping...");
        return ['migrated' => 0, 'skipped' => 0, 'errors' => 0];
    }
    
    log_info("Found {$totalCount} rows to migrate");
    
    // Build insert SQL
    $columnList = implode('`, `', $columns);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $insertSql = "INSERT INTO `{$mysqlTable}` (`{$columnList}`) VALUES ({$placeholders})";
    
    $insertStmt = $mysql->prepare($insertSql);
    
    // Fetch data from SQLite
    $selectStmt = $sqlite->query("SELECT * FROM \"{$tableName}\"");
    
    $migrated = 0;
    $skipped = 0;
    $errors = 0;
    $current = 0;
    
    while ($row = $selectStmt->fetch(PDO::FETCH_ASSOC)) {
        $current++;
        
        // Check for duplicates
        if (recordExists($mysql, $mysqlTable, $uniqueCheck, $row)) {
            $skipped++;
            log_progress($tableName, $current, $totalCount);
            continue;
        }
        
        // Prepare values
        $values = [];
        foreach ($columns as $col) {
            $value = $row[$col] ?? null;
            $type = $types[$col] ?? 'string';
            $values[] = convertValue($value, $type);
        }
        
        try {
            $insertStmt->execute($values);
            $migrated++;
        } catch (PDOException $e) {
            $errors++;
            log_error("Error inserting row {$current} in {$tableName}: " . $e->getMessage());
            // Log the data for debugging
            error_log("Failed data: " . json_encode($row));
        }
        
        log_progress($tableName, $current, $totalCount);
    }
    
    log_success("Table {$tableName} completed: {$migrated} migrated, {$skipped} skipped, {$errors} errors");
    
    return ['migrated' => $migrated, 'skipped' => $skipped, 'errors' => $errors];
}

// Migration statistics
$stats = [];
$totalStartTime = microtime(true);

// Migrate all tables
foreach ($TABLES as $tableConfig) {
    try {
        $result = migrateTable($sqlite, $mysql, $tableConfig);
        $stats[$tableConfig['name']] = $result;
    } catch (Exception $e) {
        log_error("Failed to migrate table {$tableConfig['name']}: " . $e->getMessage());
        $stats[$tableConfig['name']] = ['migrated' => 0, 'skipped' => 0, 'errors' => 1, 'error_msg' => $e->getMessage()];
    }
}

// Re-enable foreign key checks
$mysql->exec("SET FOREIGN_KEY_CHECKS = 1");

$totalEndTime = microtime(true);
$totalTime = round($totalEndTime - $totalStartTime, 2);

// Print summary
echo PHP_EOL;
echo str_repeat("=", 70) . PHP_EOL;
log_success("MIGRATION COMPLETE!");
echo str_repeat("=", 70) . PHP_EOL;
echo PHP_EOL;

printf("%-30s %10s %10s %10s\n", "Table", "Migrated", "Skipped", "Errors");
echo str_repeat("-", 70) . PHP_EOL;

$totalMigrated = 0;
$totalSkipped = 0;
$totalErrors = 0;

foreach ($stats as $table => $result) {
    printf("%-30s %10d %10d %10d\n", 
        $table, 
        $result['migrated'], 
        $result['skipped'], 
        $result['errors']
    );
    $totalMigrated += $result['migrated'];
    $totalSkipped += $result['skipped'];
    $totalErrors += $result['errors'];
}

echo str_repeat("-", 70) . PHP_EOL;
printf("%-30s %10d %10d %10d\n", "TOTAL", $totalMigrated, $totalSkipped, $totalErrors);
echo str_repeat("=", 70) . PHP_EOL;
echo PHP_EOL;
log_info("Total time: {$totalTime} seconds");

if ($totalErrors > 0) {
    log_warn("Migration completed with errors. Please review the error log.");
    exit(1);
} else {
    log_success("All data migrated successfully!");
    exit(0);
}
