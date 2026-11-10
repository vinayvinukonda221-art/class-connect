import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Input = forwardRef(({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(7);
    return (<div className="w-full space-y-1.5">
        {label && (<label htmlFor={inputId} className="block text-xs font-medium text-[#4D4D4D]">
            {label}
          </label>)}
        <input id={inputId} ref={ref} className={twMerge(clsx('w-full bg-[#FFFFFF] text-[#0D0D0D] border rounded-sm px-3.5 py-2 text-sm placeholder:text-[#888888] transition-colors duration-150 focus:outline-none focus:ring-1', error
            ? 'border-[#D92D20] focus:border-[#D92D20] focus:ring-[#D92D20]'
            : 'border-[#E3E3E3] focus:border-[#6C35F5] focus:ring-[#6C35F5]', className))} {...props}/>
        {error && <p className="text-xs text-[#D92D20]">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#888888]">{helperText}</p>}
      </div>);
});
Input.displayName = 'Input';
