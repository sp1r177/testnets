'use client';

import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

const sizeClasses = {
  small: 'h-4 w-4',
  medium: 'h-6 w-6',
  large: 'h-8 w-8',
};

const colorClasses = {
  primary: 'border-primary-600',
  white: 'border-white',
  gray: 'border-gray-600',
};

export default function LoadingSpinner({ 
  size = 'medium', 
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div className={`
      inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]
      ${sizeClasses[size]}
      ${colorClasses[color]}
      ${className}
    `} role="status">
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
}