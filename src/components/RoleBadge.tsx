import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleBadgeProps {
  role: AppRole;
}

const roleConfig: Record<AppRole, { label: string; className: string }> = {
  leitor: { label: 'Leitor', className: 'bg-secondary text-secondary-foreground' },
  editor: { label: 'Editor', className: 'bg-primary/10 text-primary' },
  avaliador: { label: 'Avaliador', className: 'bg-pending/10 text-pending' },
  admin: { label: 'Admin', className: 'bg-destructive/10 text-destructive' },
};

const RoleBadge = ({ role }: RoleBadgeProps) => {
  const config = roleConfig[role];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
};

export default RoleBadge;
