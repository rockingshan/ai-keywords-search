import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Smartphone, Trash2, Eye, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../store/useStore';
import { appApi } from '../lib/api';
import { extractAppStoreId } from '../lib/utils';

export function MyApps() {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { myApps, addMyApp, removeMyApp } = useStore();
  const navigate = useNavigate();

  const handleAddApp = async () => {
    setError(null);

    // Extract ID from URL
    const appId = extractAppStoreId(urlInput);
    if (!appId) {
      setError('Invalid App Store URL or ID. Please enter a valid URL like: https://apps.apple.com/us/app/instagram/id389801252 or just the ID: 389801252');
      return;
    }

    // Fetch app details
    setLoading(true);
    try {
      const response = await appApi.getDetail(appId);
      const app = response.data;

      // Add to store
      addMyApp({
        id: String(app.trackId || app.id),
        name: app.trackName || app.name,
        icon: app.artworkUrl512 || app.artworkUrl100 || app.artworkUrl60,
        developer: app.artistName || app.sellerName,
        addedAt: new Date().toISOString(),
      });

      setUrlInput('');
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch app:', err);
      setError(err.response?.data?.error || 'Failed to fetch app. Please check the URL/ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveApp = (id: string, appName: string) => {
    if (confirm(`Remove "${appName}" from My Apps?`)) {
      removeMyApp(id);
    }
  };

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-dark border-b border-gray-800/50">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-10 h-64 w-64 rounded-full bg-primary/30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 h-80 w-80 rounded-full bg-orange-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative px-6 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="animate-slide-up">
              <h1 className="text-5xl lg:text-6xl font-bold mb-4">
                <span className="text-gradient">My Apps</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-6 max-w-2xl">
                Add your apps to analyze keywords, optimize metadata, and track performance.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {/* Add App Form */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-6 w-6 mr-2 text-primary" />
                Add New App
              </CardTitle>
              <CardDescription>
                Paste an App Store URL or enter the App Store ID to add your app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="https://apps.apple.com/us/app/instagram/id389801252 or just 389801252"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleAddApp()}
                  className="flex-1"
                />
                <Button
                  onClick={handleAddApp}
                  disabled={!urlInput.trim() || loading}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Adding...
                    </div>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add App
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-1">Example URLs:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>https://apps.apple.com/us/app/instagram/id389801252</li>
                  <li>https://apps.apple.com/app/id389801252</li>
                  <li>Just the ID: 389801252</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Apps Grid */}
          {myApps.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-16 pb-16 text-center">
                <Smartphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-xl font-bold mb-2">No apps added yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Add your first app using the form above to start analyzing keywords and optimizing metadata.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Your Apps ({myApps.length})</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myApps.map((app) => (
                  <Card key={app.id} className="hover-lift transition-all group">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="size-16 rounded-xl bg-cover bg-center border border-border flex-shrink-0"
                          style={{
                            backgroundImage: app.icon ? `url("${app.icon}")` : 'none',
                            backgroundColor: app.icon ? 'transparent' : '#f4eee7'
                          }}
                        >
                          {!app.icon && (
                            <div className="h-full flex items-center justify-center">
                              <Smartphone className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate" title={app.name}>
                            {app.name}
                          </h3>
                          {app.developer && (
                            <p className="text-sm text-muted-foreground truncate" title={app.developer}>
                              {app.developer}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs">
                            ID: {app.id}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/apps/${app.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => navigate(`/apps/${app.id}?optimize=true`)}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Optimize
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveApp(app.id, app.name)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
