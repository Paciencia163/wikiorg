import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate('/');
      }
    } else {
      if (!displayName.trim()) {
        toast.error('Por favor insira o seu nome');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Conta criada! Verifique o seu email para confirmar.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-foreground">WikiOrg</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLogin ? 'Aceda à sua conta' : 'Crie a sua conta'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-6">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="O seu nome completo"
                required={!isLogin}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.pt"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLogin ? 'Entrar' : 'Criar conta'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {isLogin ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
