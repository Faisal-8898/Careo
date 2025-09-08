import clsx from 'clsx';

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  gray: 'badge-gray',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export default function Badge({ 
  children, 
  variant = 'gray', 
  size = 'md',
  className,
  ...props 
}) {
  return (
    <span
      className={clsx(
        'badge',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Status-specific badge components
export function TrainStatusBadge({ status, ...props }) {
  const getVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'maintenance':
        return 'warning';
      case 'inactive':
        return 'danger';
      default:
        return 'gray';
    }
  };

  return (
    <Badge variant={getVariant(status)} {...props}>
      {status}
    </Badge>
  );
}

export function BookingStatusBadge({ status, ...props }) {
  const getVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'waitlisted':
        return 'warning';
      case 'completed':
        return 'info';
      default:
        return 'gray';
    }
  };

  return (
    <Badge variant={getVariant(status)} {...props}>
      {status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, ...props }) {
  const getVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'info';
      default:
        return 'gray';
    }
  };

  return (
    <Badge variant={getVariant(status)} {...props}>
      {status}
    </Badge>
  );
}
