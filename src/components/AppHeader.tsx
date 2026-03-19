import { BookOpen, FileText, Users, Search, LogOut, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import RoleBadge from '@/components/RoleBadge';
import NotificationBell from '@/components/NotificationBell';

const AppHeader = () => {
  const { profile, userRole, signOut } = useAuth();

  return (
    <header className="border-b bg-card">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-serif text-xl font-semibold text-foreground">WikiOrg</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar documentação..."
              className="h-9 w-72 rounded-lg border bg-background pl-9 pr-4 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          {userRole === 'admin' && (
            <Link
              to="/admin/utilizadores"
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Gestão de Utilizadores"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Utilizadores</span>
            </Link>
          )}
          <NotificationBell />
          {userRole && <RoleBadge role={userRole} />}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {profile?.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
          </div>
          <button
            onClick={signOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
