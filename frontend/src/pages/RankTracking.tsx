import { TrendingUp } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function RankTracking() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 animate-slide-up">
          <span className="text-gradient">Rank Tracking</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8">Monitor keyword rankings</p>
        <Card className="text-center py-16">
          <CardContent>
            <TrendingUp className="h-20 w-20 mx-auto mb-4 text-primary opacity-50" />
            <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">Track your app rankings over time</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
