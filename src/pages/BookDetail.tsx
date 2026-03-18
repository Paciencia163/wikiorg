import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import StatusBadge from '@/components/StatusBadge';
import { ChevronRight, FileText, Plus, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import BookCollaborators from '@/components/BookCollaborators';

const BookDetail = () => {
  const { bookId } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [authorNames, setAuthorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [chapterDialog, setChapterDialog] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const canEdit = userRole && ['editor', 'avaliador', 'admin'].includes(userRole);

  const fetchData = async () => {
    const { data: bookData } = await supabase.from('books').select('*').eq('id', bookId!).single();
    setBook(bookData);

    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId!)
      .order('sort_order');
    setChapters(chaptersData || []);

    const { data: articlesData } = await supabase
      .from('articles')
      .select('*')
      .eq('book_id', bookId!)
      .order('created_at');
    setArticles(articlesData || []);

    // Fetch author names
    if (articlesData && articlesData.length > 0) {
      const authorIds = [...new Set(articlesData.map(a => a.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', authorIds);
      if (profiles) {
        const names: Record<string, string> = {};
        profiles.forEach(p => { names[p.user_id] = p.display_name; });
        setAuthorNames(names);
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [bookId]);

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    setCreating(true);
    const maxOrder = chapters.reduce((max, c) => Math.max(max, c.sort_order), 0);
    const { error } = await supabase.from('chapters').insert({
      book_id: bookId!,
      title: newChapterTitle.trim(),
      sort_order: maxOrder + 1,
    });
    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success('Capítulo criado!');
      setNewChapterTitle('');
      setChapterDialog(false);
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

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground">Livro não encontrado.</p>
          <Link to="/" className="mt-4 inline-block text-primary hover:underline">Voltar ao início</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 animate-fade-in">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{book.title}</span>
        </div>

        {/* Book header */}
        <div className="mb-8 rounded-xl border bg-card p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{book.icon || '📖'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-serif text-2xl font-bold text-foreground">{book.title}</h1>
                {book.department && (
                  <span className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground">
                    {book.department}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{book.description}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{articles.length} artigos</span>
                <span>Última atualização: {new Date(book.updated_at).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Capítulos</h2>
          {canEdit && (
            <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Novo Capítulo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif">Criar Capítulo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateChapter} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Título do capítulo</Label>
                    <Input value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={creating}>
                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Collaborators */}
        <div className="mb-8">
          <BookCollaborators bookId={book.id} bookCreatedBy={book.created_by} />
        </div>

        {chapters.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground text-sm">Ainda não existem capítulos neste livro.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter) => {
              const chapterArticles = articles.filter(a => a.chapter_id === chapter.id);
              return (
                <div key={chapter.id} className="rounded-xl border bg-card">
                  <div className="border-b px-6 py-4">
                    <h3 className="font-serif text-base font-semibold text-foreground">
                      {chapter.sort_order}. {chapter.title}
                    </h3>
                  </div>
                  <div className="divide-y">
                    {chapterArticles.map((article) => (
                      <Link
                        key={article.id}
                        to={`/livro/${book.id}/artigo/${article.id}`}
                        className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-secondary/50 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {article.title}
                          </span>
                          <StatusBadge status={article.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-4">
                          <span className="hidden sm:inline">{authorNames[article.author_id] || 'Desconhecido'}</span>
                          <span>{new Date(article.updated_at).toLocaleDateString('pt-PT')}</span>
                          <span>v{article.version}</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                      </Link>
                    ))}
                  </div>
                  {canEdit && (
                    <div className="px-6 py-3 border-t">
                      <button
                        onClick={() => navigate(`/livro/${book.id}/capitulo/${chapter.id}/novo-artigo`)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Adicionar artigo
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookDetail;
