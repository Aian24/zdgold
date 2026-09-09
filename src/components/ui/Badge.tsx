'use client';

import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline-gold';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  size = 'md',
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-bold rounded-full border transition-colors';

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[10px] tracking-wide',
    md: 'px-3 py-1 text-xs tracking-wide',
  };

  const variantStyles = {
    gold: 'bg-gold-500/15 text-gold-800 border-gold-500/40',
    'outline-gold': 'bg-white text-gold-700 border-gold-500/60 font-mono tracking-wider shadow-2xs',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    amber: 'bg-amber-50 text-amber-800 border-amber-300',
    rose: 'bg-rose-50 text-rose-800 border-rose-300',
    slate: 'bg-neutral-100 text-neutral-800 border-neutral-300',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
