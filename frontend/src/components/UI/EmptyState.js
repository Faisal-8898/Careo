import {
  MagnifyingGlassIcon,
  DocumentIcon,
  TicketIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const icons = {
  search: MagnifyingGlassIcon,
  document: DocumentIcon,
  train: DocumentIcon, // Use document icon as fallback for train
  ticket: TicketIcon,
  warning: ExclamationTriangleIcon,
};

export default function EmptyState({
  icon = 'document',
  title,
  description,
  action,
  className,
}) {
  const IconComponent = icons[icon] || icons.document;

  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mx-auto h-24 w-24 text-gray-300">
        <IconComponent className="h-full w-full" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}

// Predefined empty states
export function NoSearchResults({ onNewSearch }) {
  return (
    <EmptyState
      icon="search"
      title="No trains found"
      description="We couldn't find any trains matching your search criteria. Try adjusting your search parameters."
      action={
        onNewSearch && (
          <button
            onClick={onNewSearch}
            className="btn-primary"
          >
            Search again
          </button>
        )
      }
    />
  );
}

export function NoBookings({ onBook }) {
  return (
    <EmptyState
      icon="ticket"
      title="No bookings yet"
      description="You haven't made any bookings yet. Start by searching for trains and book your first journey."
      action={
        onBook && (
          <button
            onClick={onBook}
            className="btn-primary"
          >
            Book a ticket
          </button>
        )
      }
    />
  );
}

export function NoTrains({ onCreate }) {
  return (
    <EmptyState
      icon="train"
      title="No trains configured"
      description="No trains have been configured in the system yet. Add the first train to get started."
      action={
        onCreate && (
          <button
            onClick={onCreate}
            className="btn-primary"
          >
            Add first train
          </button>
        )
      }
    />
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }) {
  return (
    <EmptyState
      icon="warning"
      title={title}
      description={description}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="btn-secondary"
          >
            Try again
          </button>
        )
      }
    />
  );
}
