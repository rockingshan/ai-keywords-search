import { useQuery } from '@tanstack/react-query'
import { History as HistoryIcon, TrendingUp, Clock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { historyApi } from '../lib/api'
import { formatDistanceToNow } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function History() {
  // Fetch trending keywords
  const { data: trendingData, isLoading: trendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const response = await historyApi.trending('us', 24, 20)
      return response.data
    },
  })

  // Fetch AI generations history
  const { data: aiGenerations, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-generations'],
    queryFn: async () => {
      const response = await historyApi.aiGenerations(20)
      return response.data
    },
  })

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-dark border-b border-gray-800/50">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-1/4 h-64 w-64 rounded-full bg-amber-500/30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative px-6 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="animate-slide-up">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-gradient">Search History</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-6 max-w-2xl">
                Track your research activity, trending keywords, and AI-generated insights over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Total Searches</CardDescription>
                <HistoryIcon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gradient">
                  {trendingData?.trending?.reduce((sum: number, t: any) => sum + t.searchCount, 0) || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>Trending Keywords</CardDescription>
                <TrendingUp className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gradient">
                  {trendingData?.trending?.length || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>AI Generations</CardDescription>
                <Sparkles className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-gradient">
                  {aiGenerations?.generations?.length || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Keywords */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-primary" />
                Trending Keywords (Last 24 Hours)
              </CardTitle>
              <CardDescription>Most searched keywords across all users</CardDescription>
            </CardHeader>
            <CardContent>
              {trendingLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4">Loading trending data...</p>
                </div>
              ) : trendingData?.trending && trendingData.trending.length > 0 ? (
                <div className="space-y-3">
                  {trendingData.trending.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-accent transition-all hover-lift"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-warm text-primary-foreground font-bold glow-orange-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-lg">{item.keyword}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.searchCount} searches • Avg difficulty: {item.avgDifficulty}/100
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={item.avgDifficulty > 60 ? 'danger' : item.avgDifficulty > 30 ? 'warning' : 'success'}>
                          {item.avgDifficulty > 60 ? 'Hard' : item.avgDifficulty > 30 ? 'Medium' : 'Easy'}
                        </Badge>
                        {item.trend && (
                          <TrendingUp className={`h-5 w-5 ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HistoryIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No trending data yet. Start analyzing keywords to see trends!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending Chart */}
          {trendingData?.trending && trendingData.trending.length > 0 && (
            <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle>Search Volume Trends</CardTitle>
                <CardDescription>Keyword popularity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendingData.trending.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="keyword"
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.5)"
                      tick={{ fill: 'rgba(255,255,255,0.7)' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,107,53,0.3)',
                        borderRadius: '12px',
                        color: '#fff'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="searchCount"
                      stroke="url(#colorGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#ff6b35', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff6b35" />
                        <stop offset="50%" stopColor="#f7931e" />
                        <stop offset="100%" stopColor="#ffd700" />
                      </linearGradient>
                    </defs>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Generations History */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-primary" />
                Recent AI Generations
              </CardTitle>
              <CardDescription>Your AI-powered keyword suggestions and analyses</CardDescription>
            </CardHeader>
            <CardContent>
              {aiLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="mt-4">Loading AI history...</p>
                </div>
              ) : aiGenerations?.generations && aiGenerations.generations.length > 0 ? (
                <div className="space-y-4">
                  {aiGenerations.generations.map((gen: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-gradient-to-br from-orange-500/5 to-yellow-500/5 border border-primary/10 hover:border-primary/30 transition-all hover-lift"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={gen.type === 'keyword' ? 'success' : gen.type === 'competitor' ? 'warning' : 'default'}>
                              {gen.type}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {gen.generatedAt && formatDistanceToNow(new Date(gen.generatedAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="font-medium">{gen.baseKeyword || gen.appId || 'Analysis'}</p>
                        </div>
                        <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {gen.suggestions && gen.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {gen.suggestions.slice(0, 5).map((sugg: any, idx: number) => (
                            <Badge key={idx} className="bg-primary/10 text-primary">
                              {sugg.keyword || sugg}
                            </Badge>
                          ))}
                          {gen.suggestions.length > 5 && (
                            <Badge variant="outline">+{gen.suggestions.length - 5} more</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No AI generations yet. Try the AI Tools to generate keywords!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Activity Timeline */}
          <Card className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-6 w-6 mr-2 text-primary" />
                Activity Timeline
              </CardTitle>
              <CardDescription>Your recent search and analysis activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingData?.trending?.slice(0, 8).map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-all"
                  >
                    <div className="h-2 w-2 rounded-full bg-gradient-warm glow-orange-sm flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="font-medium">{item.keyword}</p>
                      <p className="text-xs text-muted-foreground">
                        Analyzed {item.searchCount} times
                      </p>
                    </div>
                    <Badge variant={item.avgDifficulty > 60 ? 'danger' : item.avgDifficulty > 30 ? 'warning' : 'success'}>
                      Difficulty: {item.avgDifficulty}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
