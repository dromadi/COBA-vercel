import Link from 'next/link';
import { ReactNode } from 'react';

type EmptyStateAction = {
  label: string;
  href: string;
  variant?: 'primary' | 'outline';
};

type EmptyStateCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  actions?: EmptyStateAction[];
};

export default function EmptyStateCard({ title, description, icon, actions = [] }: EmptyStateCardProps) {
  return (
    <div className="empty-state card-glass">
      <div className="empty-state__icon" aria-hidden>
        {icon}
      </div>
      <div className="empty-state__content">
        <h3 className="h6 mb-1">{title}</h3>
        <p className="small-muted mb-0">{description}</p>
      </div>
      {actions.length > 0 && (
        <div className="empty-state__actions">
          {actions.map(action => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className={`btn ${action.variant === 'outline' ? 'btn-outline-primary' : 'btn-primary'} btn-sm`}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
