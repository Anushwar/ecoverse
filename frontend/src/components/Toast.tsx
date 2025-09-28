import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onRemove: (id: string) => void;
}

const Toast = ({ id, type, title, message, duration = 5000, onRemove }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircleIcon,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900',
          textColor: 'text-green-800',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-800',
        };
      case 'warning':
        return {
          icon: ExclamationTriangleIcon,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          textColor: 'text-yellow-800',
        };
      case 'info':
      default:
        return {
          icon: InformationCircleIcon,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-800',
        };
    }
  };

  const config = getToastConfig();
  const Icon = config.icon;

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className={`max-w-md w-full min-w-0 ${config.bgColor} border ${config.borderColor} rounded-lg shadow-lg p-4 pointer-events-auto ring-1 ring-black ring-opacity-5`}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.iconColor}`} />
        </div>
        <div className="ml-3 w-0 flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.titleColor} break-words`}>
            {title}
          </p>
          {message && (
            <p className={`mt-1 text-sm ${config.textColor} break-words leading-relaxed`}>
              {message}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className={`rounded-md inline-flex ${config.textColor} hover:${config.titleColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onRemove(id), 300);
            }}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Toast;