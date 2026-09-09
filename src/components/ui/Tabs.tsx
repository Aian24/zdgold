'use client';

import React from 'react';
import clsx from 'clsx';

interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={clsx('flex border-b border-gold-500/25 overflow-x-auto no-scrollbar gap-2', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-200 cursor-pointer',
              isActive
                ? 'border-gold-600 text-gold-800 bg-gold-500/10 rounded-t-xl'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-gold-500/30'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  isActive
                    ? 'bg-gold-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
