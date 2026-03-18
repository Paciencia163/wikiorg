import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'rascunho' | 'pendente' | 'aprovado' | 'rejeitado';
}

const statusConfig = {
  rascunho: { label: 'Rascunho', className: 'bg-secondary text-secondary-foreground' },
  pendente: { label: 'Pendente', className: 'bg-pending text-pending-foreground' },
  aprovado: { label: 'Aprovado', className: 'bg-success text-success-foreground' },
  rejeitado: { label: 'Rejeitado', className: 'bg-destructive text-destructive-foreground' },
};

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
