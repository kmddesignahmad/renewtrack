import { useLang } from '../lib/LangContext';

export default function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();

  const classes: Record<string, string> = {
    active: 'badge-active',
    due_soon: 'badge-due',
    expired: 'badge-expired',
    review: 'badge-review',
  };

  const labels: Record<string, string> = {
    active: t('status_active'),
    due_soon: t('status_due_soon'),
    expired: t('status_expired'),
    review: t('status_review'),
  };

  return (
    <span className={classes[status] || 'badge bg-gray-100 text-gray-600'}>
      {labels[status] || status}
    </span>
  );
}
