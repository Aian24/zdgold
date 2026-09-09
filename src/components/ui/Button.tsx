'use client';

import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs font-bold tracking-wide',
    md: 'px-5 py-2.5 text-xs font-bold tracking-wide',
    lg: 'px-7 py-3.5 text-sm font-bold tracking-wide',
  };

  const variantStyles = {
    primary: 'bg-gradient-to-r from-gold-500 via-gold-500 to-gold-600 text-white hover:from-gold-400 hover:to-gold-500 shadow-md shadow-gold-500/20 font-bold border border-gold-400/40',
    secondary: 'bg-white text-neutral-800 hover:bg-neutral-50 border border-gold-500/30 hover:border-gold-500 shadow-xs font-bold',
    outline: 'bg-transparent text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400',
    'gold-outline': 'bg-white text-gold-700 border border-gold-500 hover:bg-gold-500/10 font-bold shadow-xs',
    ghost: 'bg-transparent text-neutral-700 hover:bg-gold-500/10 hover:text-gold-700',
    danger: 'bg-red-600 hover:bg-red-500 text-white shadow-xs',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      {children}
      {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
