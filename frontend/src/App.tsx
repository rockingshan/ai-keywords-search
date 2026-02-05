import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import { KeywordResearch } from "./pages/KeywordResearch";
import { KeywordJobs } from "./pages/KeywordJobs";
import { MyApps } from "./pages/MyApps";
import AppDetails from "./pages/AppDetails";
import { MyTracking } from "./pages/MyTracking";
import CompetitorAnalysis from "./pages/CompetitorAnalysis";
import { AITools } from "./pages/AITools";
import { History } from "./pages/History";
import MetadataOptimizer from "./pages/MetadataOptimizer";
import IntentAnalysis from "./pages/IntentAnalysis";
import { OpportunityFinder } from "./pages/OpportunityFinder";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename="/keywordsearch">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="keywords" element={<KeywordResearch />} />
            <Route path="jobs" element={<KeywordJobs />} />
            <Route path="opportunities" element={<OpportunityFinder />} />
            <Route path="apps" element={<MyApps />} />
            <Route path="apps/:appId" element={<AppDetails />} />
            <Route path="tracking" element={<MyTracking />} />
            <Route path="competitors" element={<CompetitorAnalysis />} />
            <Route path="ai-tools" element={<AITools />} />
            <Route path="history" element={<History />} />
            <Route path="metadata" element={<MetadataOptimizer />} />
            <Route path="intent" element={<IntentAnalysis />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
