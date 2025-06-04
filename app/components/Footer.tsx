'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-white hover:text-blue-200 transition-colors">
                CityMaid
              </Link>
            </div>
            <p className="text-base text-blue-100">
              CityMaid connects domestic helpers with employers in Nepal, making the hiring process simple and efficient.
            </p>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">For Maids</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/maid-profile" className="text-base text-blue-100 hover:text-white transition-colors">
                  Create Profile
                </Link>
              </li>
              <li>
                <Link href="/find-jobs" className="text-base text-blue-100 hover:text-white transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link href="/maids" className="text-base text-blue-100 hover:text-white transition-colors">
                  Browse Jobs
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">For Employers</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/find-maids" className="text-base text-blue-100 hover:text-white transition-colors">
                  Find Maids
                </Link>
              </li>
              <li>
                <Link href="/post-job" className="text-base text-blue-100 hover:text-white transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/employers" className="text-base text-blue-100 hover:text-white transition-colors">
                  Employer Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-blue-200 tracking-wider uppercase">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-base text-blue-100 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="text-base text-blue-100 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/auth" className="text-base text-blue-100 hover:text-white transition-colors">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-blue-700 pt-8">
          <p className="text-base text-blue-200 text-center">
            © {new Date().getFullYear()} CityMaid. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
} 