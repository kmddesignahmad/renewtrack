export default function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    active: 'badge-active',
    due_soon: 'badge-due',
    expired: 'badge-expired',
    review: 'badge-review',
  };

  const labels: Record<string, string> = {
    active: 'Active',
    due_soon: 'Due Soon',
    expired: 'Expired',
    review: 'Review',
  };

  return (
    <span className={classes[status] || 'badge bg-gray-100 text-gray-600'}>
      {labels[status] || status}
    </span>
  );
}
