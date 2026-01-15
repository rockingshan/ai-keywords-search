import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Zap, Sparkles, Target, Lightbulb } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { aiApi } from '../lib/api'

export function AITools() {
  const [descriptionInput, setDescriptionInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('Productivity')
  const [appIdInput, setAppIdInput] = useState('')
  const [competitorIds, setCompetitorIds] = useState('')
  const [metadataTitle, setMetadataTitle] = useState('')
  const [metadataDescription, setMetadataDescription] = useState('')
  const [metadataKeywords, setMetadataKeywords] = useState('')
  const [intentKeyword, setIntentKeyword] = useState('')

  // AI Keyword Suggestions
  const keywordSuggestions = useMutation({
    mutationFn: async (data: { description: string; category: string; country: string }) => {
      const response = await aiApi.suggestKeywords({
        description: data.description,
        category: data.category,
        country: data.country,
      })
      return response.data
    },
  })

  // Competitor Analysis
  const competitorAnalysis = useMutation({
    mutationFn: async (data: { appId: string; competitorIds: string[]; country: string }) => {
      const response = await aiApi.analyzeCompetitors({
        appId: data.appId,
        competitorIds: data.competitorIds,
        country: data.country,
      })
      return response.data
    },
  })

  // Metadata Optimization
  const metadataOptimization = useMutation({
    mutationFn: async (data: {
      description: string;
      currentTitle: string;
      currentSubtitle?: string;
      targetKeywords: string[];
      country: string;
    }) => {
      const response = await aiApi.optimizeMetadata({
        description: data.description,
        currentTitle: data.currentTitle,
        currentSubtitle: data.currentSubtitle,
        targetKeywords: data.targetKeywords,
        country: data.country,
      })
      return response.data
    },
  })

  // Intent Analysis
  const intentAnalysis = useMutation({
    mutationFn: async (data: { keywords: string[] }) => {
      const response = await aiApi.analyzeIntent(data.keywords)
      return response.data
    },
  })

  const handleKeywordSuggestions = () => {
    if (descriptionInput.trim()) {
      keywordSuggestions.mutate({
        description: descriptionInput,
        category: categoryInput,
        country: 'us'
      })
    }
  }

  const handleCompetitorAnalysis = () => {
    if (appIdInput.trim() && competitorIds.trim()) {
      const ids = competitorIds.split(',').map(id => id.trim()).filter(id => id.length > 0)
      competitorAnalysis.mutate({
        appId: appIdInput,
        competitorIds: ids,
        country: 'us'
      })
    }
  }

  const handleMetadataOptimization = () => {
    if (metadataTitle.trim() && metadataDescription.trim()) {
      const keywords = metadataKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
      metadataOptimization.mutate({
        description: metadataDescription,
        currentTitle: metadataTitle,
        targetKeywords: keywords,
        country: 'us'
      })
    }
  }

  const handleIntentAnalysis = () => {
    if (intentKeyword.trim()) {
      const keywords = intentKeyword.split(',').map(k => k.trim()).filter(k => k.length > 0)
      intentAnalysis.mutate({ keywords: keywords.length > 0 ? keywords : [intentKeyword.trim()] })
    }
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-dark border-b border-gray-800/50">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-yellow-500/30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-40 left-1/4 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative px-6 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="animate-slide-up">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-gradient">AI-Powered Tools</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-6 max-w-2xl">
                Leverage advanced AI to generate keywords, analyze competitors, optimize metadata, and understand search intent.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* AI Keyword Generator */}
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-primary" />
                AI Keyword Generator
              </CardTitle>
              <CardDescription>Generate relevant keyword suggestions using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 flex-col md:flex-row">
                <Input
                  placeholder="Describe your app (e.g., 'fitness tracking app')..."
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="h-12 px-4 rounded-xl bg-card border border-input min-w-[200px] text-foreground"
                >
                  <option value="Productivity">Productivity</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Games">Games</option>
                  <option value="Social Networking">Social Networking</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Finance">Finance</option>
                  <option value="Education">Education</option>
                  <option value="Utilities">Utilities</option>
                </select>
                <Button
                  onClick={handleKeywordSuggestions}
                  disabled={!descriptionInput.trim() || keywordSuggestions.isPending}
                  className="md:w-auto"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {keywordSuggestions.isPending ? 'Generating...' : 'Generate'}
                </Button>
              </div>

              {keywordSuggestions.data && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm text-muted-foreground">
                    Generated {keywordSuggestions.data.suggestions?.length || 0} keyword suggestions
                  </p>
                  <div className="space-y-3">
                    {keywordSuggestions.data.suggestions?.map((suggestion: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl bg-accent/50 hover:bg-accent transition-all hover-lift"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">{suggestion.keyword}</p>
                            <p className="text-sm text-muted-foreground mt-1">{suggestion.reasoning}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Badge variant={suggestion.relevance >= 8 ? 'success' : suggestion.relevance >= 5 ? 'warning' : 'default'}>
                              Relevance: {suggestion.relevance}/10
                            </Badge>
                            <Badge variant={suggestion.competition === 'low' ? 'success' : suggestion.competition === 'medium' ? 'warning' : 'danger'}>
                              {suggestion.competition}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {keywordSuggestions.isError && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
                  Error: {(keywordSuggestions.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Competitor Gap Analysis */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-6 w-6 mr-2 text-primary" />
                Competitor Gap Analyzer
              </CardTitle>
              <CardDescription>Identify keyword opportunities your competitors are missing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Your App ID (e.g., 123456789)"
                  value={appIdInput}
                  onChange={(e) => setAppIdInput(e.target.value)}
                />
                <Input
                  placeholder="Competitor IDs (comma-separated)"
                  value={competitorIds}
                  onChange={(e) => setCompetitorIds(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCompetitorAnalysis}
                disabled={!appIdInput.trim() || !competitorIds.trim() || competitorAnalysis.isPending}
                className="w-full md:w-auto"
              >
                <Target className="h-4 w-4 mr-2" />
                {competitorAnalysis.isPending ? 'Analyzing...' : 'Analyze Gaps'}
              </Button>

              {competitorAnalysis.data && (
                <div className="space-y-4 animate-fade-in">
                  {competitorAnalysis.data.analysis?.missingKeywords && competitorAnalysis.data.analysis.missingKeywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-primary" />
                        Missing Keywords Opportunities
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {competitorAnalysis.data.analysis.missingKeywords.map((keyword: string, index: number) => (
                          <Badge key={index} variant="warning" className="px-3 py-1">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {competitorAnalysis.data.analysis?.recommendations && competitorAnalysis.data.analysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">AI Recommendations</h4>
                      <div className="space-y-2">
                        {competitorAnalysis.data.analysis.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="p-3 rounded-lg bg-primary/5 border-l-4 border-primary">
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {competitorAnalysis.isError && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
                  Error: {(competitorAnalysis.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Optimizer */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lightbulb className="h-6 w-6 mr-2 text-primary" />
                Metadata Optimizer
              </CardTitle>
              <CardDescription>AI-optimized title, subtitle, and keyword suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Current app title..."
                  value={metadataTitle}
                  onChange={(e) => setMetadataTitle(e.target.value)}
                />
                <Input
                  placeholder="App description..."
                  value={metadataDescription}
                  onChange={(e) => setMetadataDescription(e.target.value)}
                />
                <Input
                  placeholder="Target keywords (comma-separated)..."
                  value={metadataKeywords}
                  onChange={(e) => setMetadataKeywords(e.target.value)}
                />
                <Button
                  onClick={handleMetadataOptimization}
                  disabled={!metadataTitle.trim() || !metadataDescription.trim() || metadataOptimization.isPending}
                  className="w-full"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {metadataOptimization.isPending ? 'Optimizing...' : 'Optimize'}
                </Button>
              </div>

              {metadataOptimization.data && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-primary/20">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Optimized Title</p>
                        <p className="font-semibold text-lg">{metadataOptimization.data.title}</p>
                      </div>
                      {metadataOptimization.data.subtitle && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Optimized Subtitle</p>
                          <p className="font-medium">{metadataOptimization.data.subtitle}</p>
                        </div>
                      )}
                      {metadataOptimization.data.keywords && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Optimized Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {metadataOptimization.data.keywords.split(',').map((kw: string, index: number) => (
                              <Badge key={index} className="bg-primary/10 text-primary">
                                {kw.trim()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {metadataOptimization.data.reasoning && (
                        <div className="pt-3 border-t border-gray-800">
                          <p className="text-sm text-muted-foreground mb-1">AI Reasoning</p>
                          <p className="text-sm">{metadataOptimization.data.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {metadataOptimization.isError && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
                  Error: {(metadataOptimization.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intent Analyzer */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-6 w-6 mr-2 text-primary" />
                Search Intent Analyzer
              </CardTitle>
              <CardDescription>Understand user intent behind keywords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter keywords to analyze intent (comma-separated for multiple)..."
                  value={intentKeyword}
                  onChange={(e) => setIntentKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleIntentAnalysis()}
                  className="flex-1"
                />
                <Button
                  onClick={handleIntentAnalysis}
                  disabled={!intentKeyword.trim() || intentAnalysis.isPending}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {intentAnalysis.isPending ? 'Analyzing...' : 'Analyze'}
                </Button>
              </div>

              {intentAnalysis.data && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-accent text-center">
                      <p className="text-sm text-muted-foreground mb-1">Primary Intent</p>
                      <Badge variant="success" className="text-base px-3 py-1">
                        {intentAnalysis.data.primaryIntent}
                      </Badge>
                    </div>
                    {intentAnalysis.data.confidence && (
                      <div className="p-4 rounded-xl bg-accent text-center">
                        <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                        <p className="text-2xl font-bold text-gradient">
                          {Math.round(intentAnalysis.data.confidence * 100)}%
                        </p>
                      </div>
                    )}
                    {intentAnalysis.data.categories && intentAnalysis.data.categories.length > 0 && (
                      <div className="p-4 rounded-xl bg-accent">
                        <p className="text-sm text-muted-foreground mb-2">Categories</p>
                        <div className="flex flex-wrap gap-1">
                          {intentAnalysis.data.categories.map((cat: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {intentAnalysis.data.reasoning && (
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm font-medium mb-2">Analysis</p>
                      <p className="text-sm text-muted-foreground">{intentAnalysis.data.reasoning}</p>
                    </div>
                  )}
                </div>
              )}

              {intentAnalysis.isError && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive">
                  Error: {(intentAnalysis.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
