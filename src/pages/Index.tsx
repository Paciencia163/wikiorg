import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AppHeader from '@/components/AppHeader';
import BookCard from '@/components/BookCard';
import { Plus, BookOpen, FileText, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const Index = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<any[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [collabCounts, setCollabCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', description: '', department: '', icon: '📖' });
  const [creating, setCreating] = useState(false);

  const canCreate = userRole && ['editor', 'avaliador', 'admin'].includes(userRole);

  const fetchData = async () => {
    const { data: booksData } = await supabase.from('books').select('*').order('updated_at', { ascending: false });
    setBooks(booksData || []);

    const { data: articles } = await supabase.from('articles').select('book_id, status');
    if (articles) {
      const counts: Record<string, number> = {};
      let pending = 0, approved = 0;
      articles.forEach(a => {
        counts[a.book_id] = (counts[a.book_id] || 0) + 1;
        if (a.status === 'pendente') pending++;
        if (a.status === 'aprovado') approved++;
      });
      setArticleCounts(counts);
      setStats({ total: articles.length, pending, approved });
    }

    const { data: collabs } = await supabase.from('book_collaborators').select('book_id');
    if (collabs) {
      const counts: Record<string, number> = {};
      collabs.forEach(c => { counts[c.book_id] = (counts[c.book_id] || 0) + 1; });
      setCollabCounts(counts);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title.trim() || !user) return;
    setCreating(true);
    const { error } = await supabase.from('books').insert({
      title: newBook.title.trim(),
      description: newBook.description.trim(),
      department: newBook.department.trim(),
      icon: newBook.icon || '📖',
      created_by: user.id,
    });
    if (error) {
      toast.error('Erro ao criar livro: ' + error.message);
    } else {
      toast.success('Livro criado!');
      setNewBook({ title: '', description: '', department: '', icon: '📖' });
      setDialogOpen(false);
      fetchData();
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 animate-fade-in">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Livros', value: books.length, icon: BookOpen, color: 'text-primary' },
            { label: 'Artigos', value: stats.total, icon: FileText, color: 'text-primary' },
            { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'text-pending' },
            { label: 'Aprovados', value: stats.approved, icon: CheckCircle, color: 'text-success' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs font-medium">{stat.label}</span>
              </div>
              <p className="font-serif text-2xl font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-foreground">Biblioteca de Conhecimento</h1>
            <p className="text-sm text-muted-foreground mt-1">Documentação colaborativa da organização</p>
          </div>
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Livro
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">Criar Novo Livro</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Título</Label>
                    <Input value={newBook.title} onChange={e => setNewBook(p => ({ ...p, title: e.target.value }))} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Descrição</Label>
                    <Textarea value={newBook.description} onChange={e => setNewBook(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Departamento</Label>
                      <Input value={newBook.department} onChange={e => setNewBook(p => ({ ...p, department: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Ícone (emoji)</Label>
                      <Input value={newBook.icon} onChange={e => setNewBook(p => ({ ...p, icon: e.target.value }))} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Livro
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Books grid */}
        {books.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">Ainda não existem livros.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                articleCount={articleCounts[book.id] || 0}
                collaboratorCount={collabCounts[book.id] || 0}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
