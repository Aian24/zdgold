'use client';

import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full appearance-none rounded-xl bg-white border border-gold-500/30 px-4 py-2.5 pr-10 text-xs sm:text-sm text-neutral-900 focus:border-gold-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 cursor-pointer shadow-xs',
              error && 'border-red-500',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white text-neutral-900">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-600 pointer-events-none" />
        </div>
        {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
