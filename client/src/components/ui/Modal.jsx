import React, { useEffect } from 'react';
import { X } from 'lucide-react';
export const Modal = ({ isOpen, onClose, title, description, children, maxWidth = 'md', }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const widthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0D0D0D]/40 backdrop-blur-xs transition-opacity duration-150" onClick={onClose}/>

      {/* Dialog Window */}
      <div className={`relative w-full ${widthClasses[maxWidth]} bg-[#FFFFFF] border border-[#E3E3E3] rounded-lg shadow-subtle p-5 sm:p-6 z-10 transition-all max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-start justify-between pb-3 border-b border-[#E3E3E3] mb-4">
          <div>
            <h3 className="text-base font-semibold text-[#0D0D0D] tracking-tight">{title}</h3>
            {description && <p className="text-xs text-[#4D4D4D] mt-0.5">{description}</p>}
          </div>
          <button onClick={onClose} className="p-1 rounded text-[#888888] hover:text-[#0D0D0D] hover:bg-[#F8F8FB] transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>);
};
