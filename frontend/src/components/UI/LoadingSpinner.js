import clsx from 'clsx';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colors = {
  primary: 'border-primary-600',
  white: 'border-white',
  gray: 'border-gray-400',
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className,
  ...props 
}) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-2 border-t-transparent',
        sizes[size],
        colors[color],
        className
      )}
      {...props}
    />
  );
}

export function FullPageSpinner({ message = 'Loading...', className }) {
  return (
    <div className={clsx('min-h-screen flex flex-col items-center justify-center bg-gray-50', className)}>
      <LoadingSpinner size="xl" />
      {message && (
        <p className="mt-4 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}

export function InlineSpinner({ text, size = 'sm', className }) {
  return (
    <div className={clsx('flex items-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}
