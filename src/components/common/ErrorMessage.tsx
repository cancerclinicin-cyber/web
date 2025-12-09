import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onClose?: () => void;
  showIcon?: boolean;
  className?: string;
}

export default function ErrorMessage({
  message,
  onClose,
  showIcon = true,
  className = ''
}: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-3 ${className}`}>
      {showIcon && (
        <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
          <AlertCircle className="h-3 w-3 text-red-600" />
        </div>
      )}
      <div className="flex-1">
        <p className="text-sm font-medium">Error</p>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}