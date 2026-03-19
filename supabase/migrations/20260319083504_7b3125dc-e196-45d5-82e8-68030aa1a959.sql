
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  article_id uuid REFERENCES public.articles(id) ON DELETE CASCADE,
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'submetido', 'aprovado', 'rejeitado'
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow inserts from triggers (security definer function)
CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notifications on article status change
CREATE OR REPLACE FUNCTION public.notify_article_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _book_title text;
  _article_title text;
  _reviewer_id uuid;
BEGIN
  SELECT title INTO _book_title FROM public.books WHERE id = NEW.book_id;
  _article_title := NEW.title;

  -- Article submitted for approval (status changed to 'pendente')
  IF NEW.status = 'pendente' AND (OLD.status IS NULL OR OLD.status != 'pendente') THEN
    -- Notify all admins and avaliadores
    INSERT INTO public.notifications (user_id, article_id, book_id, type, message)
    SELECT ur.user_id, NEW.id, NEW.book_id, 'submetido',
      'O artigo "' || _article_title || '" no livro "' || _book_title || '" foi submetido para aprovação.'
    FROM public.user_roles ur
    WHERE ur.role IN ('admin', 'avaliador') AND ur.user_id != NEW.author_id;
  END IF;

  -- Article approved
  IF NEW.status = 'aprovado' AND OLD.status != 'aprovado' THEN
    INSERT INTO public.notifications (user_id, article_id, book_id, type, message)
    VALUES (NEW.author_id, NEW.id, NEW.book_id, 'aprovado',
      'O seu artigo "' || _article_title || '" foi aprovado!');
  END IF;

  -- Article rejected
  IF NEW.status = 'rejeitado' AND OLD.status != 'rejeitado' THEN
    INSERT INTO public.notifications (user_id, article_id, book_id, type, message)
    VALUES (NEW.author_id, NEW.id, NEW.book_id, 'rejeitado',
      'O seu artigo "' || _article_title || '" foi rejeitado.');
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on articles table
CREATE TRIGGER on_article_status_change
  AFTER INSERT OR UPDATE OF status ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_article_status_change();
