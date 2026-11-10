import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Card = ({ children, elevated = false, className, ...props }) => {
    return (<div className={twMerge(clsx('bg-[#FFFFFF] border border-[#E3E3E3] rounded-lg p-4 sm:p-5 text-[#0D0D0D]', elevated ? 'shadow-sm' : '', className))} {...props}>
      {children}
    </div>);
};
