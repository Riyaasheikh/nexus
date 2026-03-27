import React from 'react';

// FIX: Ensure 'gray' is included in the allowed variants
export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'gray';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  className = '',
  onClick,
}) => {
  const variantClasses = {
    primary: 'bg-indigo-100 text-indigo-800',
    secondary: 'bg-slate-100 text-slate-800',
    accent: 'bg-amber-100 text-amber-800',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-orange-50 text-orange-700',
    error: 'bg-rose-50 text-rose-700',
    gray: 'bg-gray-100 text-gray-600', // FIX: Added gray mapping
  };
  
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  const roundedClass = rounded ? 'rounded-full' : 'rounded-md';
  const clickableClass = onClick ? 'cursor-pointer hover:bg-opacity-80 transition-all' : '';
  
  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center font-bold ${roundedClass} ${variantClasses[variant]} ${sizeClasses[size]} ${clickableClass} ${className}`}
    >
      {children}
    </span>
  );
};