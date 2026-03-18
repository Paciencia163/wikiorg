import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RoleBadge from '@/components/RoleBadge';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Collaborator {
  id: string;
  user_id: string;
  role: AppRole;
  display_name: string;
  email: string | null;
}

interface Props {
  bookId: string;
  bookCreatedBy: string;
}

const ROLES: { value: AppRole; label: string }[] = [
  { value: 'leitor', label: 'Leitor' },
  { value: 'editor', label: 'Editor' },
  { value: 'avaliador', label: 'Avaliador' },
  { value: 'admin', label: 'Admin' },
];

const BookCollaborators = ({ bookId, bookCreatedBy }: Props) => {
  const { user, userRole } = useAuth();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('editor');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);

  const canManage = user && (userRole === 'admin' || user.id === bookCreatedBy);

  const fetchCollaborators = async () => {
    const { data: collabs } = await supabase
      .from('book_collaborators')
      .select('id, user_id, role')
      .eq('book_id', bookId);

    if (!collabs || collabs.length === 0) {
      setCollaborators([]);
      setLoading(false);
      return;
    }

    const userIds = collabs.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
    setCollaborators(
      collabs.map(c => ({
        ...c,
        display_name: profileMap.get(c.user_id)?.display_name || 'Desconhecido',
        email: profileMap.get(c.user_id)?.email || null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchCollaborators(); }, [bookId]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, email')
      .ilike('email', `%${searchEmail.trim()}%`)
      .limit(5);
    setSearchResults(data || []);
    setSearching(false);
  };

  const handleAdd = async (userId: string) => {
    const exists = collaborators.some(c => c.user_id === userId);
    if (exists) {
      toast.error('Este utilizador já é colaborador.');
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('book_collaborators').insert({
      book_id: bookId,
      user_id: userId,
      role: selectedRole,
    });
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success('Colaborador adicionado!');
      setSearchEmail('');
      setSearchResults([]);
      setDialogOpen(false);
      fetchCollaborators();
    }
    setAdding(false);
  };

  const handleRoleChange = async (collabId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('book_collaborators')
      .update({ role: newRole })
      .eq('id', collabId);
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success('Papel atualizado!');
      fetchCollaborators();
    }
  };

  const handleRemove = async (collabId: string) => {
    const { error } = await supabase
      .from('book_collaborators')
      .delete()
      .eq('id', collabId);
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success('Colaborador removido.');
      fetchCollaborators();
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-serif text-base font-semibold text-foreground">Colaboradores</h2>
          <span className="text-xs text-muted-foreground">({collaborators.length})</span>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif">Adicionar Colaborador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Pesquisar por email</Label>
                  <div className="flex gap-2">
                    <Input
                      value={searchEmail}
                      onChange={e => setSearchEmail(e.target.value)}
                      placeholder="email@exemplo.com"
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <Button variant="secondary" onClick={handleSearch} disabled={searching}>
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Pesquisar'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Papel no livro</Label>
                  <Select value={selectedRole} onValueChange={v => setSelectedRole(v as AppRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Resultados</Label>
                    {searchResults.map(p => (
                      <div key={p.user_id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.display_name}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </div>
                        <Button size="sm" onClick={() => handleAdd(p.user_id)} disabled={adding}>
                          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Adicionar'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.length === 0 && searchEmail && !searching && (
                  <p className="text-sm text-muted-foreground text-center py-2">Nenhum utilizador encontrado.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : collaborators.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum colaborador adicionado.</p>
        </div>
      ) : (
        <div className="divide-y">
          {collaborators.map(c => (
            <div key={c.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground shrink-0">
                  {c.display_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                {canManage ? (
                  <>
                    <Select value={c.role} onValueChange={v => handleRoleChange(c.id, v as AppRole)}>
                      <SelectTrigger className="h-8 w-[120px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(c.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <RoleBadge role={c.role} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookCollaborators;
