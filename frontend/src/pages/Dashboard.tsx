import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { keywordApi, type KeywordAnalysisResponse } from "../lib/api";
import { useStore } from "../store/useStore";
import { Card, CardContent } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Loader2, TrendingUp, Star, AlertCircle } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") || "Fitness Tracker";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<KeywordAnalysisResponse | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await keywordApi.analyze(keyword);
        if (response.data) {
          setData(response.data);
        } else {
          setError("No data received from the server.");
        }
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err.message || "Failed to connect to the backend.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [keyword]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <div className="relative">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="absolute inset-0 h-12 w-12 rounded-full bg-primary/20 animate-ping"></div>
          </div>
          <p className="text-muted-foreground font-medium animate-pulse">Analyzing App Store Search Volume...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
        <Card className="max-w-md border-red-500/30 bg-red-500/5 animate-scale-in">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-red-500/10">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Analysis Failed</h2>
              <p className="text-muted-foreground mb-4">{error || "Something went wrong while fetching data."}</p>
              <Button onClick={() => window.location.reload()}>
                Retry Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <span>Keyword Analysis</span>
          <span className="text-muted-foreground">›</span>
          <span className="text-muted-foreground">Health & Fitness</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="text-gradient">{data.keyword}</span>
        </h1>
        <p className="text-muted-foreground">
          Last updated: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-foreground font-semibold">Popularity</p>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold text-gradient">{data.popularity}</span>
              <span className="text-muted-foreground font-medium">/ 100</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-warm h-full rounded-full progress-bar-fill"
                style={{ width: `${data.popularity}%` }}
              />
            </div>
            <p className="mt-4 text-emerald-500 text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              High Demand
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <p className="text-foreground font-semibold">Difficulty</p>
              <span className="text-muted-foreground">100</span>
            </div>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold">{data.difficulty}</span>
              <span className="text-muted-foreground font-medium">/ 100</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full progress-bar-fill bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                style={{ width: `${data.difficulty}%` }}
              />
            </div>
            <p className="mt-4 text-red-400 text-sm font-semibold flex items-center gap-2">
              <span className="inline-block w-4 h-4 text-center">◎</span>
              {data.competitorCount > 50 ? "High Competition" : "Moderate Competition"}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="pt-6">
            <p className="text-foreground font-semibold mb-4">Search Volume Trend</p>
            <div className="h-32 flex items-end gap-1">
              {[20, 40, 30, 70, 100, 80, 60, 90].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-warm/30 hover:bg-gradient-warm/50 transition-colors rounded-t-sm cursor-pointer"
                  style={{ height: h + "%" }}
                  title={`Month ${i + 1}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <span>Jan</span>
              <span>May</span>
              <span>Aug</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Banner */}
      <Card className="bg-gradient-warm/10 border-primary/20 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-xl">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  AI Insight: Recommendation for <span className="text-gradient">{data.keyword}</span>
                </h3>
                <p className="text-muted-foreground">
                  We found simplified high-intent keywords that are easier to rank for.
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/metadata")}>
              View Suggestions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top Ranking Apps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Top Ranking Apps</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export CSV
            </Button>
            <Button size="sm" onClick={() => navigate("/competitors")}>
              Full Analysis
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-secondary text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">App Details</th>
                  <th className="px-6 py-4">Rating</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {data.topApps && data.topApps.map((app) => (
                  <tr
                    key={app.rank}
                    className="hover:bg-secondary/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/apps/${app.id}`)}
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`text-xl font-bold ${app.rank === 1 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        #{app.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {app.icon && (
                          <div
                            className="size-12 rounded-xl bg-cover bg-center border border-stone-800"
                            style={{ backgroundImage: `url("${app.icon}")` }}
                          />
                        )}
                        <div>
                          <p className="font-bold max-w-[200px] truncate hover:text-primary transition-colors" title={app.name}>
                            {app.name}
                          </p>
                          <p className="text-muted-foreground text-sm">{app.developer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-semibold text-foreground">
                          {typeof app.rating === 'number' ? app.rating.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          ({typeof app.ratingCount === 'number' ? (app.ratingCount / 1000).toFixed(1) : '0'}k)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{app.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          useStore.getState().addTrackedApp({
                            id: String(app.id),
                            name: app.name,
                            icon: app.icon,
                            developer: app.developer
                          });
                          alert(`${app.name} added to competitors!`);
                        }}
                        className="gap-2"
                      >
                        <span className="text-primary">+</span>
                        Track
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
