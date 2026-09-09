'use client';

import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  glass = true,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-gold-500/25 p-6 transition-all duration-300 bg-white shadow-sm',
        hoverEffect && 'hover:border-gold-500/50 hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
