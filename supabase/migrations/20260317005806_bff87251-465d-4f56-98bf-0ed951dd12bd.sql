-- Create enum for article status
CREATE TYPE public.article_status AS ENUM ('rascunho', 'pendente', 'aprovado', 'rejeitado');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('leitor', 'editor', 'avaliador', 'admin');

-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  department TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'leitor',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'avaliador' THEN 2
    WHEN 'editor' THEN 3
    WHEN 'leitor' THEN 4
  END
  LIMIT 1
$$;

CREATE POLICY "Users can view roles" ON public.user_roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'leitor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  department TEXT DEFAULT '',
  icon TEXT DEFAULT '📖',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Books viewable by authenticated" ON public.books
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and above can create books" ON public.books
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'editor') OR
    public.has_role(auth.uid(), 'avaliador') OR
    public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins and creators can update books" ON public.books
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR created_by = auth.uid()
  );

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Book collaborators
CREATE TABLE public.book_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'leitor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, user_id)
);

ALTER TABLE public.book_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators viewable by authenticated" ON public.book_collaborators
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Book creators and admins can manage collaborators" ON public.book_collaborators
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.books WHERE id = book_id AND created_by = auth.uid())
  );

-- Chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chapters viewable by authenticated" ON public.chapters
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and above can create chapters" ON public.chapters
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'editor') OR
    public.has_role(auth.uid(), 'avaliador') OR
    public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Editors and above can update chapters" ON public.chapters
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'editor') OR
    public.has_role(auth.uid(), 'avaliador') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Articles table
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status article_status NOT NULL DEFAULT 'rascunho',
  author_id UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles viewable by authenticated" ON public.articles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and above can create articles" ON public.articles
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = author_id AND (
      public.has_role(auth.uid(), 'editor') OR
      public.has_role(auth.uid(), 'avaliador') OR
      public.has_role(auth.uid(), 'admin')
    )
  );
CREATE POLICY "Authors and approvers can update articles" ON public.articles
  FOR UPDATE TO authenticated USING (
    auth.uid() = author_id OR
    public.has_role(auth.uid(), 'avaliador') OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();