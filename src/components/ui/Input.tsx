'use client';

import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, rightAction, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-gold-600 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl bg-white border border-gold-500/30 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 shadow-xs',
              leftIcon && 'pl-10',
              (rightIcon || rightAction) && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {rightIcon && !rightAction && (
            <div className="absolute right-3.5 text-gold-600 pointer-events-none">
              {rightIcon}
            </div>
          )}
          {rightAction && (
            <div className="absolute right-2.5 flex items-center z-10">
              {rightAction}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-neutral-500 mt-1.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
