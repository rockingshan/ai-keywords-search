import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { aiApi } from "../lib/api";

const IntentAnalysis = () => {
    const [searchParams] = useSearchParams();
    const keyword = searchParams.get("keyword") || "Fitness Tracker";
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    useEffect(() => {
        const fetchIntent = async () => {
            setLoading(true);
            try {
                const response = await aiApi.analyzeIntent([keyword]);
                setAnalysis(response.data.analysis[0]);
            } catch (error) {
                console.error("Failed to fetch intent:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchIntent();
    }, [keyword]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-10 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-foreground text-4xl font-black tracking-tight">
                    Search Intent Analysis
                </h1>
                <p className="text-muted-foreground text-lg">
                    Analyzing user psychology for{" "}
                    <span className="text-foreground font-bold bg-primary/10 px-2 py-1 rounded">
                        "{keyword}"
                    </span>
                </p>
            </div>

            {analysis ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm">
                            <p className="text-muted-foreground text-xs font-bold uppercase">
                                Primary Intent
                            </p>
                            <p className="text-2xl font-black mt-2 text-primary uppercase">{analysis.intent}</p>
                            <p className="text-xs text-muted-foreground mt-1">Categorized by AI</p>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm">
                            <p className="text-muted-foreground text-xs font-bold uppercase">
                                Confidence Score
                            </p>
                            <p className="text-3xl font-black mt-2 text-foreground">{(analysis.confidence * 100).toFixed(0)}%</p>
                            <div className="w-full bg-accent h-1.5 rounded-full mt-2">
                                <div className="bg-primary h-full rounded-full" style={{ width: `${analysis.confidence * 100}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-sm">
                            <p className="text-muted-foreground text-xs font-bold uppercase">
                                Psychology Tag
                            </p>
                            <p className="text-2xl font-black mt-2 text-foreground">Discovery</p>
                            <p className="text-xs text-green-500 font-bold">Growing Trend</p>
                        </div>
                        <div className="bg-gradient-to-br from-primary to-orange-500 p-6 rounded-xl shadow-lg text-white">
                            <p className="text-white/80 text-xs font-bold uppercase">
                                AI Status
                            </p>
                            <p className="text-2xl font-black mt-2">Verified</p>
                            <p className="text-sm font-medium">Based on semantic models</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 bg-card border border-gray-800 p-8 rounded-xl">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                                <span className="material-symbols-outlined text-primary">psychology</span>
                                Cognitive Analysis
                            </h2>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-lg leading-relaxed text-foreground">
                                    {analysis.explanation}
                                </p>
                            </div>

                            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-accent rounded-lg border border-gray-800">
                                    <h4 className="font-bold text-sm mb-2 text-primary">User Motivation</h4>
                                    <p className="text-sm text-foreground">High desire for lifestyle improvement and goal tracking.</p>
                                </div>
                                <div className="p-4 bg-accent rounded-lg border border-gray-800">
                                    <h4 className="font-bold text-sm mb-2 text-primary">Purchase Readiness</h4>
                                    <p className="text-sm text-foreground">High. Users are actively comparing solutions to buy or subscribe.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="material-symbols-outlined text-6xl">format_quote</span>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4 text-yellow-300">
                                        <span className="material-symbols-outlined">auto_awesome</span>
                                        <h3 className="font-bold uppercase tracking-widest text-xs">Strategic Hack</h3>
                                    </div>
                                    <p className="text-lg leading-snug">
                                        "Optimize for <span className="text-yellow-300 font-bold italic">feature-rich</span> visual assets. Users want to see the UI before installing."
                                    </p>
                                </div>
                            </div>

                            <div className="bg-card border border-gray-800 p-6 rounded-xl">
                                <h3 className="font-bold mb-4 flex items-center gap-2 text-foreground">
                                    <span className="material-symbols-outlined text-pink-500">trending_up</span>
                                    Market Trend
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-xs text-foreground">
                                        <span>Interest Growth</span>
                                        <span className="font-bold text-green-500">+14%</span>
                                    </div>
                                    <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-primary h-full w-[78%]"></div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-foreground">
                                        <span>Conversion Rate Est.</span>
                                        <span className="font-bold">4.2%</span>
                                    </div>
                                    <div className="w-full bg-accent h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-pink-500 h-full w-[42%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center p-20 bg-card rounded-xl border border-gray-800">
                    <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4">analytics</span>
                    <h3 className="text-xl font-bold text-foreground">No Analysis Data</h3>
                    <p className="text-muted-foreground">We couldn't analyze the intent for this keyword at this time.</p>
                </div>
            )}
        </div>
    );
};

export default IntentAnalysis;
