import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/AppHeader';
import MarkdownEditor from '@/components/MarkdownEditor';
import { ChevronRight, Loader2, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const ArticleEditor = () => {
  const { bookId, chapterId, articleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isNew = !articleId;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  // Load existing article
  if (!isNew && !loaded) {
    supabase.from('articles').select('*').eq('id', articleId!).single().then(({ data }) => {
      if (data) {
        setTitle(data.title);
        setContent(data.content || '');
      }
      setLoaded(true);
    });
  }

  const handleSave = async (status: 'rascunho' | 'pendente') => {
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    if (!user) return;
    setSaving(true);

    if (isNew) {
      const { error } = await supabase.from('articles').insert({
        title: title.trim(),
        content,
        book_id: bookId!,
        chapter_id: chapterId!,
        author_id: user.id,
        status,
      });
      if (error) {
        toast.error('Erro: ' + error.message);
      } else {
        toast.success(status === 'pendente' ? 'Artigo submetido para aprovação!' : 'Rascunho guardado!');
        navigate(`/livro/${bookId}`);
      }
    } else {
      const { data: current } = await supabase.from('articles').select('version').eq('id', articleId!).single();
      const { error } = await supabase.from('articles').update({
        title: title.trim(),
        content,
        status,
        version: (current?.version || 0) + 1,
        approved_by: null,
        approved_at: null,
      }).eq('id', articleId!);
      if (error) {
        toast.error('Erro: ' + error.message);
      } else {
        toast.success(status === 'pendente' ? 'Artigo submetido para aprovação!' : 'Alterações guardadas!');
        navigate(`/livro/${bookId}/artigo/${articleId}`);
      }
    }
    setSaving(false);
  };

  if (!loaded) {
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
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/livro/${bookId}`} className="hover:text-foreground transition-colors">Livro</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{isNew ? 'Novo Artigo' : 'Editar Artigo'}</span>
        </div>

        <div className="mx-auto max-w-3xl">
          <h1 className="font-serif text-2xl font-bold text-foreground mb-6">
            {isNew ? 'Criar Novo Artigo' : 'Editar Artigo'}
          </h1>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label>Título do artigo</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Como registar uma fatura de fornecedor"
                className="text-lg"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Conteúdo (Markdown)</Label>
              <MarkdownEditor
                value={content}
                onChange={setContent}
                placeholder="## Objetivo&#10;&#10;Descreva o objetivo deste procedimento...&#10;&#10;## Passos&#10;&#10;1. Primeiro passo&#10;2. Segundo passo"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave('rascunho')}
                disabled={saving}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Guardar Rascunho
              </Button>
              <Button
                onClick={() => handleSave('pendente')}
                disabled={saving}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Submeter para Aprovação
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArticleEditor;
