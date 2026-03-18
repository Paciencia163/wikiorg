import { Link } from 'react-router-dom';
import { FileText, Users } from 'lucide-react';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    description: string | null;
    department: string | null;
    icon: string | null;
    updated_at: string;
  };
  articleCount: number;
  collaboratorCount: number;
}

const BookCard = ({ book, articleCount, collaboratorCount }: BookCardProps) => {
  return (
    <Link
      to={`/livro/${book.id}`}
      className="group flex flex-col rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30"
    >
      <div className="mb-4 flex items-start justify-between">
        <span className="text-3xl">{book.icon || '📖'}</span>
        {book.department && (
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {book.department}
          </span>
        )}
      </div>
      <h3 className="mb-2 font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
        {book.title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {book.description || 'Sem descrição'}
      </p>
      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {articleCount} artigos
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {collaboratorCount}
          </span>
        </div>
        <span>{new Date(book.updated_at).toLocaleDateString('pt-PT')}</span>
      </div>
    </Link>
  );
};

export default BookCard;
