import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Key, ArrowLeft, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiKey {
  id: string;
  provider: string;
  key_name: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  is_active: boolean;
}

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  // Form state
  const [provider, setProvider] = useState("gmail");
  const [keyName, setKeyName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadApiKeys();
      }
    });
  }, [navigate]);

  const loadApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error: any) {
      toast.error('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('api_keys')
        .insert({
          provider,
          key_name: keyName,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri || `${window.location.origin}/oauth/callback`,
          scopes: provider === 'gmail'
            ? ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send']
            : ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'],
          is_active: true
        });

      if (error) throw error;

      toast.success('API key added successfully');
      setShowAddDialog(false);
      setKeyName('');
      setClientId('');
      setClientSecret('');
      setRedirectUri('');
      loadApiKeys();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add API key');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('API key deleted');
      loadApiKeys();
    } catch (error: any) {
      toast.error('Failed to delete API key');
    }
  };

  const toggleShowSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskSecret = (secret: string) => {
    return secret.substring(0, 4) + '•'.repeat(secret.length - 8) + secret.substring(secret.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your API keys and OAuth credentials</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Configure OAuth credentials for Gmail and Outlook
                </CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add API Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add API Key</DialogTitle>
                    <DialogDescription>
                      Enter your OAuth application credentials
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddApiKey} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gmail">Gmail</SelectItem>
                          <SelectItem value="outlook">Outlook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Key Name</Label>
                      <Input
                        value={keyName}
                        onChange={(e) => setKeyName(e.target.value)}
                        placeholder="e.g., Production Gmail"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client ID</Label>
                      <Input
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="Your OAuth Client ID"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Client Secret</Label>
                      <Input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="Your OAuth Client Secret"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Redirect URI (Optional)</Label>
                      <Input
                        value={redirectUri}
                        onChange={(e) => setRedirectUri(e.target.value)}
                        placeholder={`${window.location.origin}/oauth/callback`}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      Add API Key
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No API keys configured yet.</p>
                <p className="text-sm mt-2">Add your OAuth credentials to connect email accounts.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <Card key={key.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                              <Key className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{key.key_name}</h3>
                              <p className="text-sm text-muted-foreground capitalize">{key.provider}</p>
                            </div>
                          </div>
                          <div className="grid gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Client ID:</span>
                              <p className="font-mono mt-1">{key.client_id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Client Secret:</span>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="font-mono flex-1">
                                  {showSecrets[key.id] ? key.client_secret : maskSecret(key.client_secret)}
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleShowSecret(key.id)}
                                >
                                  {showSecrets[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Redirect URI:</span>
                              <p className="font-mono mt-1 text-xs">{key.redirect_uri}</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteApiKey(key.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
