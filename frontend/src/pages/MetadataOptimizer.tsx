import { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { appApi, aiApi } from "../lib/api";

const MetadataOptimizer = () => {
    const { myApps, selectedAppId, setSelectedAppId } = useStore();
    const [appDetail, setAppDetail] = useState<any>(null);
    const [targetKeywords, setTargetKeywords] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [optimizedData, setOptimizedData] = useState<any>(null);

    const mainApp = myApps.find(a => a.id === selectedAppId) || myApps[0];

    useEffect(() => {
        if (mainApp && !selectedAppId) {
            setSelectedAppId(mainApp.id);
        }
    }, [mainApp, selectedAppId, setSelectedAppId]);

    useEffect(() => {
        const fetchDetail = async () => {
            if (selectedAppId) {
                try {
                    const response = await appApi.getDetail(selectedAppId);
                    setAppDetail(response.data);
                } catch (error) {
                    console.error("Failed to fetch app detail:", error);
                }
            }
        };
        fetchDetail();
    }, [selectedAppId]);

    const runOptimization = async () => {
        if (!appDetail) return;

        setLoading(true);
        try {
            const response = await aiApi.optimizeMetadata({
                description: appDetail.description,
                currentTitle: appDetail.name,
                currentSubtitle: appDetail.subtitle || "",
                targetKeywords: targetKeywords.length > 0 ? targetKeywords : ["workout", "fitness", "health"],
                country: "us"
            });
            setOptimizedData(response.data);
        } catch (error) {
            console.error("Failed to optimize metadata:", error);
            alert("Failed to optimize. Ensure your Gemini API key is correct.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-in slide-in-from-right duration-500">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div className="max-w-2xl">
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-foreground">
                        Optimize App Presence
                    </h1>
                    <p className="text-muted-foreground">
                        Leverage AI to refine your title, subtitle, and keyword list for
                        maximum reach.
                    </p>
                </div>
                {myApps.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase">Select Your App</label>
                        <select
                            value={selectedAppId || ""}
                            onChange={(e) => setSelectedAppId(e.target.value)}
                            className="bg-card border border-gray-800 rounded-xl px-4 py-2 font-bold focus:ring-2 focus:ring-primary outline-none text-foreground"
                        >
                            {myApps.map(app => (
                                <option key={app.id} value={app.id}>{app.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <button
                    onClick={runOptimization}
                    disabled={loading || !appDetail}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-white">
                        auto_awesome
                    </span>
                    {loading ? "Optimizing..." : "Run AI Analysis"}
                </button>
            </div>

            {appDetail ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Current */}
                    <div className="bg-card p-6 rounded-2xl border border-gray-800 shadow-md flex flex-col gap-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                            <span className="material-symbols-outlined text-muted-foreground">
                                edit_note
                            </span>{" "}
                            Current Metadata
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-bold text-foreground">App Title</label>
                                    <span className="text-xs text-muted-foreground">{appDetail.name.length}/30</span>
                                </div>
                                <input
                                    className="w-full rounded-lg border border-gray-800 bg-background p-2 text-foreground"
                                    value={appDetail.name}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-sm font-bold text-foreground">Category</label>
                                </div>
                                <input
                                    className="w-full rounded-lg border border-gray-800 bg-background p-2 text-foreground"
                                    value={appDetail.category}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-foreground">Description Snippet</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-800 bg-background text-xs p-2 text-foreground"
                                    rows={6}
                                    readOnly
                                    value={appDetail.description?.slice(0, 500) + "..."}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-gray-800 shadow-md flex flex-col gap-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                            <span className="material-symbols-outlined text-muted-foreground">
                                key
                            </span>{" "}
                            Target Keywords
                        </h3>
                        <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">Enter keywords you want to rank for (comma separated)</p>
                            <input
                                className="w-full rounded-lg border border-gray-800 bg-background p-3 font-medium outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                                placeholder="e.g. fitness, workout, gym"
                                value={targetKeywords.join(", ")}
                                onChange={(e) => setTargetKeywords(e.target.value.split(",").map(k => k.trim()))}
                            />
                            <div className="flex flex-wrap gap-2">
                                {targetKeywords.filter(k => k).map((kw, i) => (
                                    <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-md border border-primary/20 uppercase">
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className={`bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-md flex flex-col gap-6 relative overflow-hidden transition-all ${!optimizedData ? 'opacity-50 grayscale' : ''}`}>
                        {!optimizedData && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-background/10 backdrop-blur-[2px]">
                                <p className="bg-card px-4 py-2 rounded-lg font-bold shadow-lg border border-primary/20 text-foreground">Click 'Run AI Analysis' to see optimizations</p>
                            </div>
                        )}
                        <div className="absolute -top-10 -right-10 size-40 bg-primary/10 blur-3xl rounded-full"></div>
                        <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined font-fill">
                                magic_button
                            </span>{" "}
                            AI-Optimized Suggestions
                        </h3>

                        {optimizedData && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-primary">
                                            Suggested Title
                                        </label>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(optimizedData.title)}
                                            className="text-primary text-xs font-bold hover:underline cursor-pointer"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="p-3 bg-card border border-primary/30 rounded-lg text-sm font-bold flex justify-between text-foreground">
                                        <span>{optimizedData.title}</span>
                                        <span className={`text-xs px-2 rounded-full ${optimizedData.titleCharCount > 30 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                            {optimizedData.titleCharCount}/30
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-primary">
                                            Suggested Subtitle
                                        </label>
                                        <button
                                            onClick={() => navigator.clipboard.writeText(optimizedData.subtitle)}
                                            className="text-primary text-xs font-bold hover:underline cursor-pointer"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <div className="p-3 bg-card border border-primary/30 rounded-lg text-sm font-medium flex justify-between text-foreground">
                                        <span>{optimizedData.subtitle}</span>
                                        <span className={`text-xs px-2 rounded-full ${optimizedData.subtitleCharCount > 30 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                            {optimizedData.subtitleCharCount}/30
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-primary">
                                            Strategic Keywords (100 Chars)
                                        </label>
                                        <span className={`text-xs font-bold px-2 rounded-full ${optimizedData.keywordsCharCount > 100 ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
                                            {optimizedData.keywordsCharCount}/100
                                        </span>
                                    </div>
                                    <div className="p-3 bg-card border border-primary/30 rounded-lg text-xs leading-relaxed break-all text-foreground">
                                        {optimizedData.keywords}
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                                    <h4 className="text-xs font-bold text-primary uppercase mb-2">AI Reasoning</h4>
                                    <p className="text-xs text-foreground leading-relaxed italic">
                                        "{optimizedData.reasoning}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bg-card p-12 rounded-xl border border-gray-800 text-center">
                    <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">app_registration</span>
                    <h3 className="text-xl font-bold mb-2 text-foreground">No App Selected</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        Please add your app in "My Apps" section first to optimize its metadata.
                    </p>
                </div>
            )}
        </div>
    );
};

export default MetadataOptimizer;
