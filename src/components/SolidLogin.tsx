import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SolidAuthService } from '@/services/solidAuth';
import { Shield, Globe, Lock } from 'lucide-react';

interface SolidLoginProps {
  onLoginAttempt: () => void;
}

const SolidLogin = ({ onLoginAttempt }: SolidLoginProps) => {
  const [customIssuer, setCustomIssuer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  
  const auth = SolidAuthService.getInstance();
  const providers = auth.getProviders();

  const handleLogin = async (issuer: string) => {
    if (!issuer) return;
    
    setIsLoading(true);
    onLoginAttempt();
    
    try {
      await auth.loginWithProvider(issuer);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderLogin = () => {
    if (selectedProvider) {
      handleLogin(selectedProvider);
    }
  };

  const handleCustomLogin = () => {
    if (customIssuer) {
      handleLogin(customIssuer);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Digital Product Passport</h1>
          <p className="text-muted-foreground">
            Securely manage your digital product passports using Solid Pod technology
          </p>
        </div>

        <Card className="bg-gradient-card shadow-card border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Connect Your Pod</CardTitle>
            <CardDescription className="text-center">
              Login with your Solid Pod to access your digital passports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="provider-select">Choose a Pod Provider</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger id="provider-select" className="w-full">
                    <SelectValue placeholder="Select your Pod provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.url} value={provider.url}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-xs text-muted-foreground">{provider.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleProviderLogin}
                disabled={!selectedProvider || isLoading}
                className="w-full bg-gradient-primary hover:shadow-elevated transition-all duration-300"
                size="lg"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isLoading ? 'Connecting...' : 'Connect to Pod'}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or use custom provider</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-issuer">Custom OIDC Issuer</Label>
                <Input
                  id="custom-issuer"
                  type="url"
                  placeholder="https://your-pod-provider.com"
                  value={customIssuer}
                  onChange={(e) => setCustomIssuer(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <Button
                onClick={handleCustomLogin}
                disabled={!customIssuer || isLoading}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                Connect Custom Provider
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            Don't have a Solid Pod yet?{' '}
            <a 
              href="https://solidproject.org/users/get-a-pod" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get one here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolidLogin;