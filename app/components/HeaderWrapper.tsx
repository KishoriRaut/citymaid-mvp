'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

const noHeaderRoutes = [
  '/maid-dashboard',
  '/login',
  '/auth',
  '/maid-profile'
];

export default function HeaderWrapper() {
  const pathname = usePathname();
  console.log('Current pathname:', pathname); // Debug log
  const showHeader = !noHeaderRoutes.some(route => pathname?.startsWith(route));
  console.log('Show header:', showHeader); // Debug log
  
  if (!showHeader) return null;
  return <Header />;
} 