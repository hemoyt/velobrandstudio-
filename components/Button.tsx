'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  // More sophisticated base styles: slightly tighter tracking, uppercase option (optional), smooth transitions
  const baseStyles = "rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 tracking-wide";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base"
  };

  const variants = {
    // Solid Black/Charcoal for a premium studio feel
    primary: "bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-lg shadow-stone-200 hover:shadow-xl disabled:bg-stone-300 disabled:shadow-none",
    // Warm Stone for secondary
    secondary: "bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:bg-stone-50",
    // Elegant outline
    outline: "border border-stone-300 bg-transparent text-stone-600 hover:border-stone-800 hover:text-stone-900",
    // Ghost
    ghost: "text-stone-500 hover:text-stone-900 hover:bg-stone-100/50"
  };

  return (
    <button 
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="font-serif italic">Crafting...</span>
        </>
      ) : children}
    </button>
  );
};