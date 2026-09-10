'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
  color?: string;
}

const sizeMap = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label,
  color = 'text-gold-600',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Loader2 className={`${sizeMap[size]} animate-spin ${color} shrink-0`} />
      </div>
      {label && (
        <p className="text-xs text-neutral-600 font-mono tracking-tight font-medium animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
};
