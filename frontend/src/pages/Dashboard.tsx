import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { keywordApi, type KeywordAnalysisResponse } from "../lib/api";
import { useStore } from "../store/useStore";

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
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-bold animate-pulse">Analyzing App Store Search Volume...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
        <div className="bg-red-500/10 p-8 rounded-2xl border border-red-500/30 max-w-md">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold mb-2 text-foreground">Analysis Failed</h2>
          <p className="text-muted-foreground mb-6">{error || "Something went wrong while fetching data."}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-all"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <span>Keyword Analysis</span>
          <span className="material-symbols-outlined text-xs">
            chevron_right
          </span>
          <span>Health & Fitness</span>
        </div>
        <h1 className="text-foreground text-4xl font-extrabold tracking-tight">
          {data.keyword}
        </h1>
        <p className="text-muted-foreground">
          Last updated: Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-foreground font-semibold">
              Popularity
            </p>
            <span className="material-symbols-outlined text-muted-foreground">
              info
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-foreground">
              {data.popularity}
            </span>
            <span className="text-muted-foreground font-medium">/ 100</span>
          </div>
          <div className="w-full bg-accent h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${data.popularity}%` }}
            ></div>
          </div>
          <p className="mt-4 text-green-500 text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">
              trending_up
            </span>{" "}
            High Demand
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-foreground font-semibold">
              Difficulty
            </p>
            <span className="material-symbols-outlined text-muted-foreground">
              info
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-foreground">
              {data.difficulty}
            </span>
            <span className="text-muted-foreground font-medium">/ 100</span>
          </div>
          <div className="w-full bg-accent h-2 rounded-full overflow-hidden">
            <div
              className="bg-yellow-500/60 h-full rounded-full"
              style={{ width: `${data.difficulty}%` }}
            ></div>
          </div>
          <p className="mt-4 text-red-500 text-sm font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">
              target
            </span>{" "}
            {data.competitorCount > 50 ? "High Competition" : "Moderate Competition"}
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm">
          <p className="text-foreground font-semibold mb-4">
            Search Volume Trend
          </p>
          <div className="h-32 flex items-end gap-1">
            {[20, 40, 30, 70, 100, 80, 60, 90].map((h, i) => (
              <div
                key={i}
                className="bg-primary/20 hover:bg-primary transition-colors w-full rounded-t-sm"
                style={{ height: h + "%" }}
                title={`Month ${i + 1}`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            <span>Jan</span>
            <span>May</span>
            <span>Aug</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary to-[#ff8c42] p-6 rounded-xl text-white shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">
              AI Insight: Recommendation for {data.keyword}
            </h3>
            <p className="text-white/90">
              We found simplified high-intent keywords that are easier to rank for.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/metadata")}
          className="bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all shadow-sm cursor-pointer"
        >
          View Suggestions
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-xl font-bold">
            Top Ranking Apps
          </h3>
          <div className="flex gap-2">
            <button className="text-sm font-bold text-foreground bg-accent px-4 py-2 rounded-lg cursor-pointer hover:bg-accent/80 transition-colors">
              Export CSV
            </button>
            <button
              onClick={() => navigate("/competitors")}
              className="text-sm font-bold text-white bg-primary px-4 py-2 rounded-lg cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Full Analysis
            </button>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-accent text-muted-foreground text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4"># Rank</th>
                <th className="px-6 py-4">App Details</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.topApps && data.topApps.map((app) => (
                <tr
                  key={app.rank}
                  className="hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate(`/apps/${app.id}`)}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`text-xl font-bold ${app.rank === 1 ? "text-primary" : "text-muted-foreground"}`}
                    >
                      {app.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="size-12 rounded-xl bg-cover bg-center border border-gray-800"
                        style={{ backgroundImage: `url("${app.icon}")` }}
                      ></div>
                      <div>
                        <p className="text-foreground font-bold max-w-[200px] truncate hover:text-primary transition-colors" title={app.name}>
                          {app.name}
                        </p>
                        <p className="text-muted-foreground text-sm">{app.developer}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <span className="material-symbols-outlined text-[18px] font-fill">
                        star
                      </span>
                      <span className="text-foreground font-semibold">
                        {typeof app.rating === 'number' ? app.rating.toFixed(1) : '0.0'}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        ({typeof app.ratingCount === 'number' ? (app.ratingCount / 1000).toFixed(1) : '0'}k)
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-accent text-foreground px-3 py-1 rounded-full text-xs font-bold">
                      {app.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        useStore.getState().addTrackedApp({
                          id: String(app.id),
                          name: app.name,
                          icon: app.icon,
                          developer: app.developer
                        });
                        alert(`${app.name} added to competitors!`);
                      }}
                      className="text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1 ml-auto transition-all hover:scale-105"
                      title="Track as competitor"
                    >
                      <span className="material-symbols-outlined text-sm">
                        add_circle
                      </span>
                      <span className="text-xs font-bold uppercase">Track</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
