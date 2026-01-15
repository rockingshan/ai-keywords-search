import { useState } from 'react';
import { Search, TrendingUp, Sparkles, Download, Filter, BookmarkPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { trackedApi } from '../lib/api';

interface KeywordOpportunity {
  keyword: string;
  popularity: number;
  difficulty: number;
  competitorCount: number;
  opportunityScore: number;
}

interface AppIdea {
  name: string;
  elevatorPitch: string;
  description: string;
  targetKeywords: string[];
  uniqueSellingPoints: string[];
  keyFeatures: string[];
  targetAudience: string;
  estimatedDifficulty: string;
}

export function OpportunityFinder() {
  const [category, setCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [country, setCountry] = useState('us');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [referenceKeyword, setReferenceKeyword] = useState('');

  // Filters
  const [minPopularity, setMinPopularity] = useState(0);
  const [maxPopularity, setMaxPopularity] = useState(100);
  const [minDifficulty, setMinDifficulty] = useState(0);
  const [maxDifficulty, setMaxDifficulty] = useState(100);

  // Results
  const [keywords, setKeywords] = useState<KeywordOpportunity[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [appIdeas, setAppIdeas] = useState<AppIdea[]>([]);
  const [sortBy, setSortBy] = useState<'opportunityScore' | 'popularity' | 'difficulty'>('opportunityScore');
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  const handleDiscover = async () => {
    if (!category.trim()) {
      alert('Please enter a category');
      return;
    }

    setLoading(true);
    setSelectedKeywords(new Set()); // Clear selection on new search
    try {
      const response = await fetch('http://localhost:3000/api/opportunities/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          targetAudience: targetAudience || undefined,
          country,
          filters: {
            minPopularity,
            maxPopularity,
            minDifficulty,
            maxDifficulty,
          },
          referenceKeyword: referenceKeyword || undefined,
        }),
      });

      if (!response.ok) throw new Error('Discovery failed');

      const data = await response.json();
      setKeywords(data.keywords);
      setStats(data.stats);
    } catch (error: any) {
      console.error('Discovery error:', error);
      alert(error.message || 'Failed to discover opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (keywords.length === 0) {
      alert('Discover keywords first');
      return;
    }

    setLoading(true);
    try {
      const topKeywords = keywords.slice(0, 15).map(k => k.keyword);

      const response = await fetch('http://localhost:3000/api/opportunities/app-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: topKeywords,
          category,
          count: 5,
        }),
      });

      if (!response.ok) throw new Error('Idea generation failed');

      const data = await response.json();
      setAppIdeas(data.ideas);
    } catch (error: any) {
      console.error('Idea generation error:', error);
      alert(error.message || 'Failed to generate app ideas');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelected = async () => {
    if (selectedKeywords.size === 0) {
      alert('Please select keywords to track');
      return;
    }

    try {
      const keywordsToTrack = keywords
        .filter(kw => selectedKeywords.has(kw.keyword))
        .map(kw => ({
          keyword: kw.keyword,
          country,
          popularity: kw.popularity,
          difficulty: kw.difficulty,
          opportunityScore: kw.opportunityScore,
          competitorCount: kw.competitorCount,
        }));

      await trackedApi.trackKeywords(keywordsToTrack);
      alert(`Successfully tracked ${keywordsToTrack.length} keywords!`);
      setSelectedKeywords(new Set());
    } catch (error: any) {
      console.error('Tracking error:', error);
      alert('Failed to track keywords');
    }
  };

  const handleSaveAppIdea = async (idea: AppIdea) => {
    try {
      await trackedApi.saveAppIdea({
        ...idea,
        category,
        estimatedDifficulty: idea.estimatedDifficulty as 'Easy' | 'Moderate' | 'Hard',
      });
      alert(`Saved "${idea.name}" to your tracking list!`);
    } catch (error: any) {
      console.error('Save app idea error:', error);
      alert('Failed to save app idea');
    }
  };

  const toggleKeywordSelection = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const exportToCSV = () => {
    if (keywords.length === 0) return;

    const headers = ['Keyword', 'Popularity', 'Difficulty', 'Opportunity Score', 'Competitors'];
    const rows = keywords.map(k => [
      k.keyword,
      k.popularity,
      k.difficulty,
      k.opportunityScore,
      k.competitorCount,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opportunities-${category}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 30) return 'bg-green-100 text-green-800';
    if (difficulty < 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const sortedKeywords = [...keywords].sort((a, b) => {
    if (sortBy === 'opportunityScore') return b.opportunityScore - a.opportunityScore;
    if (sortBy === 'popularity') return b.popularity - a.popularity;
    return a.difficulty - b.difficulty;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Hero Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-gradient">Opportunity Finder</span>
        </h1>
        <p className="text-muted-foreground">
          Discover high-value keywords and generate new app ideas
        </p>
      </div>

      {/* Discovery Form */}
      <Card className="animate-scale-in">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2 text-primary" />
            Discover Opportunities
          </CardTitle>
          <CardDescription>
            Enter a category to discover keyword opportunities and app ideas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-1 block">Category *</label>
              <Input
                placeholder="e.g., Fitness, Productivity..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-1 block">Target Audience (Optional)</label>
              <Input
                placeholder="e.g., Beginners, Professionals..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-sm font-medium mb-1 block">Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-card border border-input"
              >
                <option value="us">🇺🇸 United States</option>
                <option value="gb">🇬🇧 United Kingdom</option>
                <option value="de">🇩🇪 Germany</option>
                <option value="fr">🇫🇷 France</option>
                <option value="jp">🇯🇵 Japan</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium mb-1 block">Reference Keyword (Optional)</label>
            <Input
              placeholder="Find keywords related to..."
              value={referenceKeyword}
              onChange={(e) => setReferenceKeyword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Generate keywords related to a specific term
            </p>
          </div>

          {/* Advanced Filters */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-xl">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Popularity Range: {minPopularity} - {maxPopularity}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minPopularity}
                      onChange={(e) => setMinPopularity(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={maxPopularity}
                      onChange={(e) => setMaxPopularity(Number(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Difficulty Range: {minDifficulty} - {maxDifficulty}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={minDifficulty}
                      onChange={(e) => setMinDifficulty(Number(e.target.value))}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={maxDifficulty}
                      onChange={(e) => setMaxDifficulty(Number(e.target.value))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleDiscover}
            disabled={!category.trim() || loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Discovering...
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5 mr-2" />
                Discover Opportunities
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {stats && keywords.length > 0 && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Keywords</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.highOpportunity}</div>
                <div className="text-sm text-muted-foreground">High Opportunity (70+)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.avgPopularity}</div>
                <div className="text-sm text-muted-foreground">Avg Popularity</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{stats.bestScore}</div>
                <div className="text-sm text-muted-foreground">Best Opportunity Score</div>
              </CardContent>
            </Card>
          </div>

          {/* Scatter Plot */}
          <Card>
            <CardHeader>
              <CardTitle>Opportunity Landscape</CardTitle>
              <CardDescription>Sweet spot: High popularity, moderate difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="difficulty" name="Difficulty" domain={[0, 100]} label={{ value: 'Difficulty →', position: 'bottom' }} />
                  <YAxis type="number" dataKey="popularity" name="Popularity" domain={[0, 100]} label={{ value: 'Popularity →', angle: -90, position: 'left' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (active && payload && payload[0]) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                          <p className="font-bold">{data.keyword}</p>
                          <p className="text-sm">Popularity: {data.popularity}</p>
                          <p className="text-sm">Difficulty: {data.difficulty}</p>
                          <p className="text-sm font-bold">Score: {data.opportunityScore}</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  {/* Sweet spot zone */}
                  <ReferenceLine x={30} stroke="#aaa" strokeDasharray="3 3" />
                  <ReferenceLine x={60} stroke="#aaa" strokeDasharray="3 3" />
                  <ReferenceLine y={50} stroke="#aaa" strokeDasharray="3 3" />
                  <Scatter data={keywords.slice(0, 100)} fill="#8884d8">
                    {keywords.slice(0, 100).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.opportunityScore >= 70 ? '#22c55e' : entry.opportunityScore >= 40 ? '#eab308' : '#ef4444'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Keywords Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Keyword Opportunities</CardTitle>
                  <CardDescription>Sorted by opportunity score</CardDescription>
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border text-sm"
                  >
                    <option value="opportunityScore">Opportunity Score</option>
                    <option value="popularity">Popularity</option>
                    <option value="difficulty">Difficulty</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-1" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedKeywords.size > 0 && (
                <div className="mb-4">
                  <Button onClick={handleTrackSelected} className="gap-2">
                    <BookmarkPlus className="h-4 w-4" />
                    Track Selected ({selectedKeywords.size})
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-center p-3 w-12">
                        <Checkbox
                          checked={selectedKeywords.size === sortedKeywords.slice(0, 50).length && sortedKeywords.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedKeywords(new Set(sortedKeywords.slice(0, 50).map(k => k.keyword)));
                            } else {
                              setSelectedKeywords(new Set());
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-3">Keyword</th>
                      <th className="text-center p-3">Popularity</th>
                      <th className="text-center p-3">Difficulty</th>
                      <th className="text-center p-3">Opportunity Score</th>
                      <th className="text-center p-3">Competitors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sortedKeywords.slice(0, 50).map((kw, i) => (
                      <tr key={i} className="hover:bg-accent transition-colors">
                        <td className="p-3 text-center">
                          <Checkbox
                            checked={selectedKeywords.has(kw.keyword)}
                            onCheckedChange={() => toggleKeywordSelection(kw.keyword)}
                          />
                        </td>
                        <td className="p-3 font-medium">{kw.keyword}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${kw.popularity}%` }}></div>
                            </div>
                            <span className="text-xs">{kw.popularity}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant="outline" className={getDifficultyColor(kw.difficulty)}>
                            {kw.difficulty}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-bold ${getScoreColor(kw.opportunityScore)}`}>
                            {kw.opportunityScore}
                          </span>
                        </td>
                        <td className="p-3 text-center text-muted-foreground">
                          {kw.competitorCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* App Ideas Section */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                AI-Generated App Ideas
              </CardTitle>
              <CardDescription>
                Based on your keyword opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appIdeas.length === 0 ? (
                <div className="text-center py-8">
                  <Button onClick={handleGenerateIdeas} disabled={loading} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate App Ideas
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appIdeas.map((idea, i) => (
                    <Card key={i} className="hover-lift">
                      <CardHeader>
                        <CardTitle className="text-lg">{idea.name}</CardTitle>
                        <CardDescription className="italic">{idea.elevatorPitch}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm">{idea.description}</p>
                        <div>
                          <p className="text-xs font-semibold mb-1">Target Keywords:</p>
                          <div className="flex flex-wrap gap-1">
                            {idea.targetKeywords.map((kw, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold mb-1">Key Features:</p>
                          <ul className="text-xs space-y-1 list-disc list-inside">
                            {idea.keyFeatures.slice(0, 3).map((feature, j) => (
                              <li key={j}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-xs text-muted-foreground">{idea.targetAudience}</span>
                          <Badge variant={idea.estimatedDifficulty === 'Easy' ? 'success' : idea.estimatedDifficulty === 'Moderate' ? 'warning' : 'danger'}>
                            {idea.estimatedDifficulty}
                          </Badge>
                        </div>
                        <div className="pt-3">
                          <Button onClick={() => handleSaveAppIdea(idea)} variant="outline" size="sm" className="w-full gap-2">
                            <BookmarkPlus className="h-4 w-4" />
                            Save to My Tracking
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!stats && !loading && (
        <Card className="text-center py-16">
          <CardContent>
            <TrendingUp className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-2xl font-bold mb-2">Discover Your Next App Opportunity</h3>
            <p className="text-muted-foreground mb-6">
              Enter a category above to discover high-value keywords and generate app ideas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
