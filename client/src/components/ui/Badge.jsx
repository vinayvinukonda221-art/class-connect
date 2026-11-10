import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Badge = ({ children, variant = 'neutral', size = 'sm', className, ...props }) => {
  const base = 'inline-flex items-center font-sans font-medium tracking-tight rounded-sm select-none';

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 leading-4',
    md: 'text-xs px-2.5 py-1 leading-4',
  };

  const variants = {
    live: 'bg-[#E6F6EE] text-[#1F8A5B] font-semibold',
    success: 'bg-[#E6F6EE] text-[#1F8A5B] font-semibold',
    deploying: 'bg-[#EFE7FF] text-[#6C35F5] font-semibold',
    purple: 'bg-[#F4F0FF] text-[#6C35F5] border border-purple-200 font-semibold',
    neutral: 'bg-[#F8F8FB] text-[#4D4D4D] border border-[#E3E3E3]',
    error: 'bg-[#FEE4E2] text-[#D92D20] font-semibold',
    warning: 'bg-[#FEF0C7] text-[#B54708] font-semibold',
  };

  return (
    <span className={twMerge(clsx(base, sizes[size], variants[variant], className))} {...props}>
      {children}
    </span>
  );
};
