import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import RoleBadge from '@/components/RoleBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithRole {
  user_id: string;
  display_name: string;
  email: string | null;
  department: string | null;
  role: AppRole;
  role_row_id: string | null;
}

const ROLES: AppRole[] = ['leitor', 'editor', 'avaliador', 'admin'];

const AdminUsers = () => {
  const { user, userRole, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (profiles) {
      const roleMap = new Map(roles?.map(r => [r.user_id, r]) || []);
      const merged: UserWithRole[] = profiles.map(p => {
        const r = roleMap.get(p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          email: p.email,
          department: p.department,
          role: r?.role ?? 'leitor',
          role_row_id: r?.id ?? null,
        };
      });
      setUsers(merged.sort((a, b) => a.display_name.localeCompare(b.display_name)));
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (u: UserWithRole, newRole: AppRole) => {
    if (u.user_id === user?.id) {
      toast.error('Não podes alterar o teu próprio papel.');
      return;
    }
    setUpdating(u.user_id);
    if (u.role_row_id) {
      const { error } = await supabase.from('user_roles').update({ role: newRole }).eq('id', u.role_row_id);
      if (error) { toast.error(error.message); }
      else { toast.success(`Papel de ${u.display_name} alterado para ${newRole}.`); }
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: u.user_id, role: newRole });
      if (error) { toast.error(error.message); }
      else { toast.success(`Papel de ${u.display_name} definido como ${newRole}.`); }
    }
    await fetchUsers();
    setUpdating(null);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Gestão de Utilizadores</h1>
            <p className="text-sm text-muted-foreground">{users.length} utilizadores registados</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilizador</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Departamento</TableHead>
                  <TableHead>Papel Atual</TableHead>
                  <TableHead className="text-right">Alterar Papel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                          {u.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        {u.display_name}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{u.email || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{u.department || '—'}</TableCell>
                    <TableCell><RoleBadge role={u.role} /></TableCell>
                    <TableCell className="text-right">
                      {u.user_id === user?.id ? (
                        <span className="text-xs text-muted-foreground">Tu</span>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(v) => handleRoleChange(u, v as AppRole)}
                          disabled={updating === u.user_id}
                        >
                          <SelectTrigger className="w-[140px] ml-auto">
                            {updating === u.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map(r => (
                              <SelectItem key={r} value={r}>
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsers;
