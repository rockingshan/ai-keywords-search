<?php
$mysql = new PDO('mysql:host=127.0.0.1;port=3306;dbname=aso_keyword_tracker;charset=utf8mb4', 'aso_user', 'aso_password123');
$tables = ['KeywordAnalysis', 'TrackedKeyword', 'SavedSearch', 'SearchHistory', 'TranslationCache', 'SavedAppIdea', 'KeywordSearchJob', 'OpportunityDiscovery', 'AIKeywordSuggestion', 'AIMetadataOptimization', 'AIIntentAnalysis', 'RankingHistory', 'AICompetitorAnalysis', 'KeywordSearchResult', 'App'];
echo "MySQL Table Counts:\n";
echo "==================\n";
foreach ($tables as $table) {
    $stmt = $mysql->query("SELECT COUNT(*) FROM $table");
    $count = $stmt->fetchColumn();
    printf("%-25s %d\n", $table, $count);
}

echo "\n";
echo "SQLite Table Counts:\n";
echo "===================\n";
$sqlite = new PDO('sqlite:prisma/prisma/aso.db');
foreach ($tables as $table) {
    $stmt = $sqlite->query("SELECT COUNT(*) FROM \"$table\"");
    $count = $stmt->fetchColumn();
    printf("%-25s %d\n", $table, $count);
}
