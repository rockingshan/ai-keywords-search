<?php
$mysql = new PDO('mysql:host=127.0.0.1;port=3306;dbname=aso_keyword_tracker;charset=utf8mb4', 'aso_user', 'aso_password123');
$mysql->exec('SET FOREIGN_KEY_CHECKS = 0');
$tables = ['KeywordSearchResult', 'AICompetitorAnalysis', 'RankingHistory', 'KeywordSearchJob', 'AIIntentAnalysis', 'AIMetadataOptimization', 'AIKeywordSuggestion', 'OpportunityDiscovery', 'SavedAppIdea', 'TranslationCache', 'SearchHistory', 'SavedSearch', 'TrackedKeyword', 'KeywordAnalysis', 'App'];
foreach ($tables as $table) {
    try {
        $mysql->exec("TRUNCATE TABLE `$table`");
        echo "Truncated $table\n";
    } catch (Exception $e) {
        echo "Skipped $table: " . $e->getMessage() . "\n";
    }
}
$mysql->exec('SET FOREIGN_KEY_CHECKS = 1');
echo "All tables processed\n";
