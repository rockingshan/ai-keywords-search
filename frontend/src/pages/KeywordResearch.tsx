import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Star, StarOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { keywordApi, trackedApi } from '../lib/api'
import { formatNumber, getDifficultyColor, getPopularityColor } from '../lib/utils'
import { useStore } from '../store/useStore'

export function KeywordResearch() {
  const navigate = useNavigate()
  const { addTrackedApp } = useStore()
  const [searchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const [activeKeyword, setActiveKeyword] = useState('')
  const [country, setCountry] = useState('us')
  const [trackedKeywords, setTrackedKeywords] = useState<Set<string>>(
    new Set(JSON.parse(localStorage.getItem('trackedKeywords') || '[]'))
  )

  // Handle URL query parameter from Dashboard search
  useEffect(() => {
    const queryKeyword = searchParams.get('q')
    if (queryKeyword) {
      setKeyword(queryKeyword)
      setActiveKeyword(queryKeyword)
    }
  }, [searchParams])

  // Save tracked keywords to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trackedKeywords', JSON.stringify(Array.from(trackedKeywords)))
  }, [trackedKeywords])

  const handleTrackKeyword = async () => {
    if (activeKeyword && analysis) {
      const isCurrentlyTracked = trackedKeywords.has(activeKeyword)

      if (!isCurrentlyTracked) {
        // Track to database
        try {
          await trackedApi.trackKeywords([{
            keyword: activeKeyword,
            country,
            popularity: analysis.popularity,
            difficulty: analysis.difficulty,
            competitorCount: analysis.competitorCount,
          }])

          // Update local state
          setTrackedKeywords(prev => new Set(prev).add(activeKeyword))
          // Keep localStorage in sync for now
          localStorage.setItem('trackedKeywords', JSON.stringify(Array.from(trackedKeywords).concat(activeKeyword)))
        } catch (error) {
          console.error('Failed to track keyword:', error)
          alert('Failed to track keyword to database')
        }
      } else {
        // Just update local state (we can add delete from DB later if needed)
        setTrackedKeywords(prev => {
          const newSet = new Set(prev)
          newSet.delete(activeKeyword)
          return newSet
        })
        localStorage.setItem('trackedKeywords', JSON.stringify(Array.from(trackedKeywords).filter(k => k !== activeKeyword)))
      }
    }
  }

  const isTracked = activeKeyword && trackedKeywords.has(activeKeyword)

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['keyword-analysis', activeKeyword, country],
    queryFn: async () => {
      const response = await keywordApi.analyze(activeKeyword, country)
      return response.data
    },
    enabled: !!activeKeyword,
  })

  const handleAnalyze = () => {
    if (keyword.trim()) {
      setActiveKeyword(keyword.trim())
    }
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        {/* Hero Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            <span className="text-gradient">Keyword Research</span>
          </h1>
          <p className="text-muted-foreground">
            Analyze keyword difficulty, popularity, and competition
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Enter keyword to analyze..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  className="h-12"
                />
              </div>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="h-12 px-4 rounded-xl bg-card border border-input"
              >
                <option value="us">🇺🇸 United States</option>
                <option value="gb">🇬🇧 United Kingdom</option>
                <option value="de">🇩🇪 Germany</option>
                <option value="fr">🇫🇷 France</option>
                <option value="jp">🇯🇵 Japan</option>
              </select>
              <Button onClick={handleAnalyze} disabled={!keyword.trim() || isLoading} size="lg" className="h-12">
                <Search className="h-5 w-5 mr-2" />
                {isLoading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {analysis && (
          <div className="space-y-6 animate-fade-in">
            {/* Header with Track Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Analysis Results for "{analysis.keyword}"</h2>
                <p className="text-sm text-muted-foreground">Last analyzed: {new Date(analysis.analyzedAt).toLocaleString()}</p>
              </div>
              <Button
                onClick={handleTrackKeyword}
                variant={isTracked ? 'primary' : 'outline'}
                className="gap-2"
              >
                {isTracked ? (
                  <>
                    <Star className="h-4 w-4 fill-current" />
                    Tracking
                  </>
                ) : (
                  <>
                    <StarOff className="h-4 w-4" />
                    Track Keyword
                  </>
                )}
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-hover">
                <CardHeader>
                  <CardDescription>Popularity Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`text-5xl font-bold ${getPopularityColor(analysis.popularity)}`}>
                      {analysis.popularity}
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-warm transition-all duration-500"
                        style={{ width: `${analysis.popularity}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysis.popularity > 60 ? 'High search volume' : analysis.popularity > 30 ? 'Moderate searches' : 'Low search volume'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardDescription>Difficulty Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`text-5xl font-bold ${getDifficultyColor(analysis.difficulty)}`}>
                      {analysis.difficulty}
                      <span className="text-2xl text-muted-foreground">/100</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-500"
                        style={{ width: `${analysis.difficulty}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {analysis.difficulty < 30 ? 'Easy to rank' : analysis.difficulty < 60 ? 'Moderate competition' : 'Highly competitive'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader>
                  <CardDescription>Competition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-5xl font-bold text-gradient">
                      {analysis.competitorCount}
                    </div>
                    <p className="text-sm text-muted-foreground">Competing apps found</p>
                    <div className="pt-2">
                      <Badge variant={analysis.competitorCount > 50 ? 'danger' : analysis.competitorCount > 20 ? 'warning' : 'success'}>
                        {analysis.competitorCount > 50 ? 'High' : analysis.competitorCount > 20 ? 'Medium' : 'Low'} Competition
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Competing Apps */}
            <Card>
              <CardHeader>
                <CardTitle>Top Competing Apps</CardTitle>
                <CardDescription>Apps currently ranking for "{analysis.keyword}"</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.topApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => navigate(`/apps/${app.id}`)}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all hover-lift cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold">
                          #{app.rank}
                        </div>
                        {app.icon && (
                          <img src={app.icon} alt={app.name} className="h-12 w-12 rounded-xl" />
                        )}
                        <div>
                          <p className="font-semibold hover:text-primary transition-colors">{app.name}</p>
                          <p className="text-sm text-muted-foreground">{app.developer}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <span className="text-yellow-500">★</span>
                            <span className="font-semibold">{app.rating?.toFixed(1) || 'N/A'}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatNumber(app.ratingCount || 0)} reviews
                          </p>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            addTrackedApp({
                              id: String(app.id),
                              name: app.name,
                              icon: app.icon,
                              developer: app.developer
                            })
                            alert(`${app.name} added to competitors!`)
                          }}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Track
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Keywords */}
            {analysis.relatedTerms && analysis.relatedTerms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Keywords</CardTitle>
                  <CardDescription>Similar keywords to explore</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.relatedTerms.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setKeyword(term)
                          setActiveKeyword(term)
                        }}
                        className="px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all hover-lift"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysis && !isLoading && (
          <Card className="text-center py-16 animate-fade-in">
            <CardContent>
              <Search className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-2xl font-bold mb-2">Start Analyzing Keywords</h3>
              <p className="text-muted-foreground mb-6">
                Enter a keyword above to get popularity, difficulty, and competition insights
              </p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-destructive animate-fade-in">
            <CardContent className="pt-6">
              <p className="text-destructive">Error: {error.message}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
