import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, Edit3 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MarkdownEditor = ({ value, onChange, placeholder }: MarkdownEditorProps) => {
  const [preview, setPreview] = useState(false);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex border-b">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            !preview ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Edit3 className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
            preview ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          Pré-visualizar
        </button>
      </div>
      {preview ? (
        <div className="prose prose-sm max-w-none p-4 min-h-[300px]">
          <ReactMarkdown>{value || '*Sem conteúdo*'}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || 'Escreva em Markdown...'}
          className="w-full min-h-[300px] p-4 text-sm font-mono bg-transparent resize-y outline-none text-foreground placeholder:text-muted-foreground"
        />
      )}
    </div>
  );
};

export default MarkdownEditor;
