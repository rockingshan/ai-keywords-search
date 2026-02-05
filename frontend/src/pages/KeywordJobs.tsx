import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { jobsApi } from '../lib/api';
import { Plus, Play, Square, Trash2, Clock, TrendingUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('aso-session-id');
  if (!sessionId) {
    sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('aso-session-id', sessionId);
  }
  return sessionId;
};

interface Job {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  searchesPerBatch: number;
  intervalMinutes: number;
  totalCycles: number;
  currentCycle: number;
  totalKeywords: number;
  country: string;
  strategy: string;
  seedCategory?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  lastRunAt?: string;
  _count: { results: number };
}

export function KeywordJobs() {
  const [sessionId, setSessionId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Initialize session ID
  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    searchesPerBatch: 1,
    intervalMinutes: 15,
    totalCycles: 10,
    country: 'us',
    strategy: 'random' as 'random' | 'category' | 'trending',
    seedCategory: '',
    notes: '',
  });

  // Fetch jobs
  const { data: jobs, isLoading, refetch } = useQuery({
    queryKey: ['jobs', sessionId],
    queryFn: () => jobsApi.list(sessionId).then(res => res.data),
    refetchInterval: 5000, // Poll every 5 seconds for running jobs
    enabled: !!sessionId, // Only run query when sessionId is available
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: () => jobsApi.create({ ...formData, sessionId }),
    onSuccess: () => {
      setShowCreateForm(false);
      setFormData({
        name: '',
        searchesPerBatch: 1,
        intervalMinutes: 15,
        totalCycles: 10,
        country: 'us',
        strategy: 'random',
        seedCategory: '',
        notes: '',
      });
      refetch();
    },
  });

  // Start job mutation
  const startJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.start(jobId),
    onSuccess: () => refetch(),
  });

  // Stop job mutation
  const stopJobMutation = useMutation({
    mutationFn: (jobId: string) => jobsApi.stop(jobId),
    onSuccess: () => refetch(),
  });

  // Delete job mutation
  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => jobsApi.delete(id),
    onSuccess: (_, deletedJobId) => {
      if (selectedJobId === deletedJobId) setSelectedJobId(null);
      refetch();
    },
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    createJobMutation.mutate();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500/20 text-yellow-500', icon: Clock, label: 'Pending' },
      running: { color: 'bg-green-500/20 text-green-500', icon: Loader2, label: 'Running' },
      paused: { color: 'bg-orange-500/20 text-orange-500', icon: Square, label: 'Paused' },
      completed: { color: 'bg-blue-500/20 text-blue-500', icon: CheckCircle, label: 'Completed' },
      failed: { color: 'bg-red-500/20 text-red-500', icon: AlertCircle, label: 'Failed' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getProgress = (job: Job) => {
    if (job.totalCycles === 0) return 0;
    return Math.round((job.currentCycle / job.totalCycles) * 100);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Keyword Search Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create automated keyword discovery jobs that run continuously
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          {showCreateForm ? 'Cancel' : 'New Job'}
        </Button>
      </div>

      {/* Create Job Form */}
      {showCreateForm && (
        <Card className="p-6 border-primary/30">
          <h2 className="text-lg font-semibold mb-4">Create New Keyword Search Job</h2>
          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Name *</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Fitness Keywords Discovery"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Strategy</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value as any })}
                >
                  <option value="random">Random Categories (Diverse)</option>
                  <option value="category">Specific Category</option>
                  <option value="trending">Trending Categories</option>
                </select>
              </div>

              {formData.strategy === 'category' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Seed Category</label>
                  <Input
                    type="text"
                    value={formData.seedCategory}
                    onChange={(e) => setFormData({ ...formData, seedCategory: e.target.value })}
                    placeholder="e.g., Health & Fitness"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Searches per Batch</label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.searchesPerBatch}
                  onChange={(e) => setFormData({ ...formData, searchesPerBatch: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-muted-foreground mt-1">How many keywords to search each cycle (1-10)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Interval (minutes)</label>
                <Input
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.intervalMinutes}
                  onChange={(e) => setFormData({ ...formData, intervalMinutes: parseInt(e.target.value) || 15 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Minutes between each search cycle</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Total Cycles</label>
                <Input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.totalCycles}
                  onChange={(e) => setFormData({ ...formData, totalCycles: parseInt(e.target.value) || 10 })}
                />
                <p className="text-xs text-muted-foreground mt-1">Total number of cycles to run</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <select
                  className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                >
                  <option value="us">United States</option>
                  <option value="gb">United Kingdom</option>
                  <option value="de">Germany</option>
                  <option value="fr">France</option>
                  <option value="jp">Japan</option>
                  <option value="in">India</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Notes (optional)</label>
              <textarea
                className="w-full px-3 py-2 bg-background border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any notes about this job..."
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={createJobMutation.isPending}>
                {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Jobs List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Active & Completed Jobs</h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="grid gap-4">
            {jobs.map((job: Job) => (
              <Card key={job.id} className="p-4 hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{job.name}</h3>
                      {getStatusBadge(job.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Strategy</p>
                        <p className="font-medium capitalize">{job.strategy}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Progress</p>
                        <p className="font-medium">
                          {job.currentCycle} / {job.totalCycles} cycles
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Keywords Found</p>
                        <p className="font-medium">{job.totalKeywords}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Interval</p>
                        <p className="font-medium">{job.intervalMinutes} min</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === 'running' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{getProgress(job)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-warm transition-all duration-500"
                            style={{ width: `${getProgress(job)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                      {job.startedAt && (
                        <span>Started: {new Date(job.startedAt).toLocaleString()}</span>
                      )}
                      {job.completedAt && (
                        <span>Completed: {new Date(job.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {(job.status === 'pending' || job.status === 'paused') && (
                      <Button
                        size="sm"
                        onClick={() => startJobMutation.mutate(job.id)}
                        disabled={startJobMutation.isPending}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    {job.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => stopJobMutation.mutate(job.id)}
                        disabled={stopJobMutation.isPending}
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedJobId(job.id)}
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteJobMutation.mutate(job.id)}
                      disabled={deleteJobMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first keyword search job to start discovering opportunities
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </Card>
        )}
      </div>

      {/* Job Detail Modal */}
      {selectedJobId && (
        <JobDetailModal
          jobId={selectedJobId}
          onClose={() => setSelectedJobId(null)}
          onJobUpdated={() => refetch()}
        />
      )}
    </div>
  );
}

// Job Detail Modal Component
interface JobDetailModalProps {
  jobId: string;
  onClose: () => void;
  onJobUpdated: () => void;
}

function JobDetailModal({ jobId, onClose, onJobUpdated }: JobDetailModalProps) {
  const [sessionId] = useState<string>(getSessionId());
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId).then(res => res.data),
    enabled: !!jobId,
  });

  const trackKeywordsMutation = useMutation({
    mutationFn: (resultIds: string[]) => jobsApi.trackKeywords(jobId, resultIds, sessionId),
    onSuccess: (response) => {
      onJobUpdated();
      const count = response.data.tracked || selectedResults.size;
      alert(`✅ ${count} keyword(s) added to tracked!\n\nView them in My Tracking page.`);
      // Clear selection
      setSelectedResults(new Set());
    },
    onError: (error: any) => {
      console.error('Error tracking keywords:', error);
      alert('❌ Failed to track keywords: ' + (error.response?.data?.error || error.message));
    },
  });

  const toggleResult = (resultId: string) => {
    const newSelected = new Set(selectedResults);
    if (newSelected.has(resultId)) {
      newSelected.delete(resultId);
    } else {
      newSelected.add(resultId);
    }
    setSelectedResults(newSelected);
  };

  const handleTrackSelected = () => {
    if (selectedResults.size === 0) {
      alert('Please select at least one keyword to track');
      return;
    }
    trackKeywordsMutation.mutate(Array.from(selectedResults));
  };

  if (!jobId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border border-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold">{job?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {job?.totalKeywords} keywords discovered • {job?._count?.results || 0} results
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : job?.results && job.results.length > 0 ? (
            <div className="space-y-4">
              {/* Actions Bar */}
              <div className="flex items-center justify-between p-4 bg-accent/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedResults.size === job.results.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedResults(new Set(job.results.map((r: any) => r.id)));
                        } else {
                          setSelectedResults(new Set());
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-600"
                    />
                    <span className="text-sm">Select All ({selectedResults.size} selected)</span>
                  </label>
                </div>
                <Button
                  onClick={handleTrackSelected}
                  disabled={trackKeywordsMutation.isPending || selectedResults.size === 0}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add to Tracked ({selectedResults.size})
                </Button>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left p-3 font-medium text-sm"></th>
                      <th className="text-left p-3 font-medium text-sm">Keyword</th>
                      <th className="text-left p-3 font-medium text-sm">Popularity</th>
                      <th className="text-left p-3 font-medium text-sm">Difficulty</th>
                      <th className="text-left p-3 font-medium text-sm">Opportunity</th>
                      <th className="text-left p-3 font-medium text-sm">Competitors</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.results.map((result: any) => (
                      <tr
                        key={result.id}
                        className={`border-b border-gray-800 hover:bg-accent/30 transition-colors ${
                          result.isTracked ? 'bg-green-500/10' : ''
                        }`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedResults.has(result.id)}
                            onChange={() => toggleResult(result.id)}
                            disabled={result.status !== 'success'}
                            className="w-4 h-4 rounded border-gray-600"
                          />
                        </td>
                        <td className="p-3">
                          <span className="font-medium">{result.keyword}</span>
                          {result.isTracked && (
                            <Badge className="ml-2 bg-green-500/20 text-green-500 text-xs">Tracked</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500"
                                style={{ width: `${result.popularity || 0}%` }}
                              />
                            </div>
                            <span className="text-sm">{result.popularity || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500"
                                style={{ width: `${result.difficulty || 0}%` }}
                              />
                            </div>
                            <span className="text-sm">{result.difficulty || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${
                            (result.opportunityScore || 0) > 5 ? 'text-green-500' :
                            (result.opportunityScore || 0) > 2 ? 'text-yellow-500' : 'text-gray-500'
                          }`}>
                            {result.opportunityScore?.toFixed(1) || '-'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{result.competitorCount || '-'}</td>
                        <td className="p-3">
                          {result.status === 'success' ? (
                            <Badge className="bg-green-500/20 text-green-500">Success</Badge>
                          ) : result.status === 'error' ? (
                            <Badge className="bg-red-500/20 text-red-500">Error</Badge>
                          ) : (
                            <Badge className="bg-gray-500/20 text-gray-500">Skipped</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results yet for this job</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
