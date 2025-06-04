'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const noFooterRoutes = [
  '/maid-dashboard',
  '/login',
  '/auth',
  '/maid-profile'
];

export default function FooterWrapper() {
  const pathname = usePathname();
  const showFooter = !noFooterRoutes.some(route => pathname?.startsWith(route));
  
  if (!showFooter) return null;
  return <Footer />;
} 