import clsx from 'clsx';

export default function Card({ 
  children, 
  className,
  padding = true,
  shadow = true,
  ...props 
}) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200',
        shadow && 'shadow-sm',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div 
      className={clsx('border-b border-gray-200 pb-4 mb-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3 
      className={clsx('text-lg font-medium text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p 
      className={clsx('text-sm text-gray-600 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div 
      className={clsx('space-y-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div 
      className={clsx('border-t border-gray-200 pt-4 mt-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Stats card component
export function StatsCard({ title, value, change, changeType, icon: Icon, ...props }) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <Card {...props}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {Icon && (
            <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary-600" />
            </div>
          )}
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <p className={clsx(
                'ml-2 flex items-baseline text-sm font-semibold',
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                !isPositive && !isNegative && 'text-gray-600'
              )}>
                {isPositive && (
                  <svg className="h-3 w-3 mr-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {isNegative && (
                  <svg className="h-3 w-3 mr-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{change}</span>
              </p>
            )}
          </div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
      </div>
    </Card>
  );
}
