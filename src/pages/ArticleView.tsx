import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import StatusBadge from '@/components/StatusBadge';
import { ChevronRight, Clock, User, CheckCircle, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const ArticleView = () => {
  const { bookId, articleId } = useParams();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [book, setBook] = useState<any>(null);
  const [authorName, setAuthorName] = useState('');
  const [approverName, setApproverName] = useState('');
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  const canApprove = userRole && ['avaliador', 'admin'].includes(userRole);
  const canEdit = userRole && ['editor', 'avaliador', 'admin'].includes(userRole);

  const fetchData = async () => {
    const { data: articleData } = await supabase
      .from('articles').select('*').eq('id', articleId!).single();
    setArticle(articleData);

    const { data: bookData } = await supabase
      .from('books').select('*').eq('id', bookId!).single();
    setBook(bookData);

    if (articleData) {
      const { data: authorProfile } = await supabase
        .from('profiles').select('display_name').eq('user_id', articleData.author_id).single();
      setAuthorName(authorProfile?.display_name || 'Desconhecido');

      if (articleData.approved_by) {
        const { data: approverProfile } = await supabase
          .from('profiles').select('display_name').eq('user_id', articleData.approved_by).single();
        setApproverName(approverProfile?.display_name || '');
      }
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [articleId]);

  const handleApproval = async (approved: boolean) => {
    if (!user) return;
    setApproving(true);
    const { error } = await supabase
      .from('articles')
      .update({
        status: approved ? 'aprovado' as const : 'rejeitado' as const,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', articleId!);

    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      toast.success(approved ? 'Artigo aprovado!' : 'Artigo rejeitado.');
      fetchData();
    }
    setApproving(false);
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

  if (!book || !article) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container py-16 text-center">
          <p className="text-muted-foreground">Artigo não encontrado.</p>
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
          <Link to={`/livro/${book.id}`} className="hover:text-foreground transition-colors">{book.title}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px]">{article.title}</span>
        </div>

        <div className="mx-auto max-w-3xl">
          {/* Article header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <StatusBadge status={article.status} />
              <span className="text-xs text-muted-foreground">Versão {article.version}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-4">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {authorName}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Editado a {new Date(article.updated_at).toLocaleDateString('pt-PT')}
              </span>
              {approverName && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  Aprovado por {approverName}
                </span>
              )}
            </div>
          </div>

          {/* Approval banner */}
          {article.status === 'pendente' && canApprove && (
            <div className="mb-6 rounded-lg border border-pending/30 bg-pending/5 p-4">
              <p className="text-sm font-medium text-pending mb-2">Este artigo aguarda aprovação</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApproval(true)}
                  disabled={approving}
                  className="bg-success hover:bg-success/90 text-success-foreground gap-1.5"
                >
                  {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleApproval(false)}
                  disabled={approving}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  Rejeitar
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          <article className="rounded-xl border bg-card p-6 md:p-8 prose prose-sm max-w-none">
            <ReactMarkdown>{article.content || '*Sem conteúdo*'}</ReactMarkdown>
          </article>

          {/* Actions */}
          {canEdit && (
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={() => navigate(`/livro/${bookId}/artigo/${articleId}/editar`)}
              >
                <Edit className="h-3.5 w-3.5" />
                Editar
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ArticleView;
