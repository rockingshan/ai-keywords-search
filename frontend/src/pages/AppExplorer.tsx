import { Smartphone } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'

export function AppExplorer() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 animate-slide-up">
          <span className="text-gradient">App Explorer</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-8">Search and analyze apps</p>
        <Card className="text-center py-16">
          <CardContent>
            <Smartphone className="h-20 w-20 mx-auto mb-4 text-primary opacity-50" />
            <h3 className="text-2xl font-bold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">App search and analysis features</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
