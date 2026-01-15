import { useState } from "react";
import { useStore } from "../store/useStore";
import { aiApi } from "../lib/api";

const CompetitorAnalysis = () => {
  const { myApps, trackedApps } = useStore();
  const [loading, setLoading] = useState(false);
  const [detailedLoading, setDetailedLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [detailedAnalysis, setDetailedAnalysis] = useState<any>(null);
  const [selectedMyApp, setSelectedMyApp] = useState<string>("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);

  const runAnalysis = async () => {
    if (!selectedMyApp || selectedCompetitors.length === 0) {
      alert("Please select your app and at least one competitor.");
      return;
    }

    setLoading(true);
    try {
      const response = await aiApi.analyzeCompetitors({
        appId: selectedMyApp,
        competitorIds: selectedCompetitors,
      });
      setAnalysis(response.data);
    } catch (error) {
      console.error("Failed to run competitor analysis:", error);
      alert("Failed to analyze competitors. Make sure the backend is running and Gemini API is configured.");
    } finally {
      setLoading(false);
    }
  };

  const runDetailedAnalysis = async (competitorId: string) => {
    if (!selectedMyApp) {
      alert("Please select your app first.");
      return;
    }

    setDetailedLoading(true);
    try {
      // This will call a new detailed comparison endpoint
      const response = await aiApi.detailedCompare({
        myAppId: selectedMyApp,
        competitorId: competitorId,
      });
      setDetailedAnalysis(response.data);
    } catch (error) {
      console.error("Failed to run detailed analysis:", error);
      alert("Failed to run detailed analysis. Make sure the backend is running and Gemini API is configured.");
    } finally {
      setDetailedLoading(false);
    }
  };

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitors(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <div className="p-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-foreground text-3xl font-black leading-tight">
              Competitor Analysis
            </h1>
            <p className="text-muted-foreground text-base">
              Deep-dive into keyword overlaps and gaps across your landscape.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={runAnalysis}
              disabled={loading || !selectedMyApp || selectedCompetitors.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold cursor-pointer disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Run AI Analysis"}
            </button>
          </div>
        </div>

        {myApps.length === 0 && trackedApps.length === 0 ? (
          <div className="bg-card p-12 rounded-xl border border-gray-800 text-center">
            <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">search_off</span>
            <h3 className="text-xl font-bold mb-2 text-foreground">No Apps Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Add your apps in the "My Apps" section and track competitor apps from the Dashboard to start comparing.
            </p>
          </div>
        ) : (
          <>
            {/* My Apps Section */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-sm align-middle mr-1">phone_iphone</span>
                Select Your App
              </h3>
              {myApps.length === 0 ? (
                <div className="bg-yellow-500/10 p-6 rounded-xl border border-yellow-500/30">
                  <p className="text-sm text-yellow-600">
                    No apps in "My Apps". Go to <strong>My Apps</strong> section to add your apps.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {myApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedMyApp(app.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedMyApp === app.id
                          ? "border-primary bg-primary/10 shadow-md"
                          : "bg-card border-gray-800 hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="size-12 rounded-xl bg-cover bg-center border border-gray-800"
                          style={{ backgroundImage: app.icon ? `url("${app.icon}")` : 'none', backgroundColor: app.icon ? 'transparent' : '#f4eee7' }}
                        ></div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-bold truncate text-foreground">{app.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{app.developer}</p>
                        </div>
                        {selectedMyApp === app.id && (
                          <span className="material-symbols-outlined text-primary">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Competitor Apps Section */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                <span className="material-symbols-outlined text-sm align-middle mr-1">target</span>
                Select Competitor Apps
              </h3>
              {trackedApps.length === 0 ? (
                <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/30">
                  <p className="text-sm text-blue-500">
                    No competitors tracked. Go to <strong>Dashboard</strong> and search for keywords to find and track competitor apps.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {trackedApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => toggleCompetitor(app.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedCompetitors.includes(app.id)
                          ? "border-blue-500 bg-blue-500/10 shadow-sm"
                          : "bg-card border-gray-800 hover:border-blue-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="size-12 rounded-xl bg-cover bg-center border border-gray-800"
                          style={{ backgroundImage: `url("${app.icon}")` }}
                        ></div>
                        <div className="flex-1 truncate">
                          <p className="text-sm font-bold truncate text-foreground">{app.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{app.developer}</p>
                        </div>
                        {selectedCompetitors.includes(app.id) && (
                          <span className="material-symbols-outlined text-blue-500">check_circle</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {analysis && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-6 relative overflow-hidden">
                  <div className="flex flex-col gap-2 max-w-4xl relative z-10">
                    <div className="flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-lg">
                        auto_awesome
                      </span>
                      <p className="text-base font-bold uppercase tracking-widest">
                        AI Strategic Recommendations
                      </p>
                    </div>
                    <ul className="list-disc list-inside space-y-2 text-foreground text-sm mt-2">
                      {analysis.analysis.recommendations.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-card p-6 rounded-xl border border-gray-800">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-500">
                      <span className="material-symbols-outlined">warning</span>
                      Missing Keywords
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">Competitors rank for these, but you don't.</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.analysis.missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-red-500/10 text-red-500 text-sm font-bold rounded-lg border border-red-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card p-6 rounded-xl border border-gray-800">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-500">
                      <span className="material-symbols-outlined">lightbulb</span>
                      Keyword Gaps
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">High-potential opportunities with low competition.</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.analysis.keywordGaps.map((kw: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-green-500/10 text-green-500 text-sm font-bold rounded-lg border border-green-500/20">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-card p-6 rounded-xl border border-gray-800">
                  <h3 className="font-bold text-lg mb-4 text-red-400">Keywords to Avoid</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.analysis.keywordsToAvoid.map((kw: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-accent text-muted-foreground text-sm font-medium rounded-lg border border-gray-700">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Comparison Section */}
            {selectedMyApp && selectedCompetitors.length > 0 && (
              <div className="mt-8">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-3xl">insights</span>
                    <div>
                      <h3 className="text-xl font-bold">Deep Competitive Analysis</h3>
                      <p className="text-white/90 text-sm">Get a detailed step-by-step guide on how competitors are outperforming and actionable improvement strategies</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedCompetitors.map((competitorId) => {
                      const competitor = trackedApps.find(a => a.id === competitorId);
                      if (!competitor) return null;
                      return (
                        <button
                          key={competitorId}
                          onClick={() => runDetailedAnalysis(competitorId)}
                          disabled={detailedLoading}
                          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm p-4 rounded-lg transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                          <div
                            className="size-10 rounded-lg bg-cover bg-center border border-white/30"
                            style={{ backgroundImage: `url("${competitor.icon}")` }}
                          ></div>
                          <div className="flex-1 text-left">
                            <p className="font-bold text-sm truncate">{competitor.name}</p>
                            <p className="text-xs text-white/80">Compare in detail</p>
                          </div>
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Analysis Results */}
            {detailedAnalysis && (
              <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 rounded-2xl border border-purple-500/30">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-4xl text-purple-500">psychology</span>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Detailed Competitive Intelligence
                      </h2>
                      <p className="text-muted-foreground">
                        {detailedAnalysis.myApp?.name} vs {detailedAnalysis.competitor?.name}
                      </p>
                    </div>
                  </div>

                  {/* Competitor Advantages */}
                  <div className="bg-card p-6 rounded-xl border border-gray-800 mb-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-purple-500">
                      <span className="material-symbols-outlined">trending_up</span>
                      How Competitor is Outperforming
                    </h3>
                    {detailedAnalysis.competitorAdvantages?.map((advantage: string, i: number) => (
                      <div key={i} className="mb-3 flex gap-3">
                        <span className="text-purple-500 font-bold">{i + 1}.</span>
                        <p className="text-foreground">{advantage}</p>
                      </div>
                    ))}
                  </div>

                  {/* Improvement Steps */}
                  <div className="bg-card p-6 rounded-xl border border-gray-800">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-green-500">
                      <span className="material-symbols-outlined">fact_check</span>
                      Step-by-Step Improvement Plan
                    </h3>
                    {detailedAnalysis.improvementSteps?.map((step: any, i: number) => (
                      <div key={i} className="mb-6 last:mb-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="size-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-foreground mb-1">{step.title || step.step}</h4>
                            <p className="text-muted-foreground text-sm">{step.description || step.details}</p>
                            {step.keywords && step.keywords.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {step.keywords.map((kw: string, j: number) => (
                                  <span key={j} className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded border border-green-500/20">
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
