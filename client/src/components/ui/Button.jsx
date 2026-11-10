import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, className, disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-sm focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';
    const sizeStyles = {
        sm: 'h-8 px-3 text-xs tracking-wide',
        md: 'h-10 px-5 text-sm tracking-normal',
        lg: 'h-12 px-6 text-base',
    };
    const variantStyles = {
        // Render Modern Light: Primary button is solid dark secondary (#0D0D0D) with white text
        primary: 'bg-[#0D0D0D] text-[#FFFFFF] hover:bg-[#2A2A2A] active:bg-[#000000]',
        // Secondary: Light outlined treatment
        secondary: 'bg-[#FFFFFF] text-[#0D0D0D] border border-[#E3E3E3] hover:bg-[#F8F8FB] active:bg-[#EEEEEE]',
        // Tertiary: Minimal text/transparent
        tertiary: 'bg-transparent text-[#0D0D0D] hover:bg-[#F8F8FB]',
        // Branded vivid purple accent
        accent: 'bg-[#6C35F5] text-[#FFFFFF] hover:bg-[#5824DB] active:bg-[#4E22C8]',
        // Destructive
        danger: 'bg-[#D92D20] text-[#FFFFFF] hover:bg-[#B42318] active:bg-[#912018]',
    };
    return (<button className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))} disabled={disabled || isLoading} {...props}>
      {isLoading ? (<span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <span>Loading...</span>
        </span>) : (children)}
    </button>);
};
