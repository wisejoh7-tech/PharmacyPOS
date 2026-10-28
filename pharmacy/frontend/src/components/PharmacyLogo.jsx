import React from 'react';

const PharmacyLogo = ({ className = "w-10 h-10" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" className={className}>
    <defs>
      <linearGradient id="hospitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="224" height="224" rx="52" fill="url(#hospitalGrad)" />
    <rect x="108" y="60" width="40" height="136" rx="10" fill="#000000" opacity="0.1" />
    <rect x="60" y="108" width="136" height="40" rx="10" fill="#000000" opacity="0.1" />
    <rect x="108" y="56" width="40" height="144" rx="10" fill="#ffffff" />
    <rect x="56" y="108" width="144" height="40" rx="10" fill="#ffffff" />
    <circle cx="128" cy="128" r="10" fill="#059669" />
  </svg>
);

export default PharmacyLogo;
