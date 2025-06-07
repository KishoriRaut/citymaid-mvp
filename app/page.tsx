'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import PlaceholderProfile from '@/components/PlaceholderProfile'

interface Maid {
  id: string
  full_name: string
  age_group: string
  gender: string
  years_experience: string
  preferred_location: string
  skills: string[]
  expected_salary: string
  photo_url: string
  created_at: string
}

export default function Home() {
  const [featuredMaids, setFeaturedMaids] = useState<Maid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({})
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    console.log('Home component mounted')
    fetchFeaturedMaids()
  }, [])

  const fetchFeaturedMaids = async () => {
    try {
      console.log('Fetching featured maids...')
      const { data, error } = await supabase
        .from('maids')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched data:', data)

      // Process photo URLs
      const processedData = data.map(maid => ({
        ...maid,
        photo_url: maid.photo_url || null,
        skills: maid.skills || []
      }))

      setFeaturedMaids(processedData)
    } catch (error) {
      console.error('Error fetching featured maids:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch maids')
    } finally {
      setLoading(false)
    }
  }

  const handleImageError = (maidId: string) => {
    setImageLoadErrors(prev => ({ ...prev, [maidId]: true }))
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative bg-blue-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Reliable Domestic Help
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-blue-100">
              Find trusted maids, housekeepers, and caregivers in Nepal. Simple, safe, and reliable.
            </p>

            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/find-maids"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10"
              >
                Find Maids
              </Link>
              <Link
                href="/maid-profile"
                className="px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Create Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Maids Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Featured Domestic Helpers
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Meet our recently registered domestic helpers
            </p>
          </div>

          {loading ? (
            <div className="mt-10 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : featuredMaids.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-gray-600">No maids found. Please check back later.</p>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {featuredMaids.map((maid) => (
                <Link
                  key={maid.id}
                  href={`/maid-details/${maid.id}`}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="aspect-w-3 aspect-h-4 relative">
                    {maid.photo_url && !imageLoadErrors[maid.id] ? (
                      <img
                        src={maid.photo_url}
                        alt={maid.full_name}
                        className="w-full h-64 object-cover"
                        onError={() => handleImageError(maid.id)}
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-100">
                        <PlaceholderProfile />
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{maid.full_name}</h3>
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Age:</span> {maid.age_group}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Experience:</span> {maid.years_experience} years
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Location:</span> {maid.preferred_location}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Skills:</span>
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {maid.skills.slice(0, 3).map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                          {maid.skills.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{maid.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <button
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        View Profile
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-10 text-center">
            <Link
              href="/find-maids"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View All Maids
              <svg
                className="ml-2 -mr-1 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Why Choose CityMaid?
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Your trusted platform for finding reliable domestic help in Nepal
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Verified & Trusted Helpers</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Every domestic helper undergoes thorough verification including identity checks, background screening, and reference validation for your complete peace of mind.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Smart Matching</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Our advanced matching system considers your specific requirements, location preferences, and budget to find the perfect domestic helper for your needs.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Hassle-Free Process</h3>
                  <p className="mt-2 text-base text-gray-500">
                    From browsing profiles to final hiring, our streamlined process takes just a few clicks. Get started in minutes and find your helper within days.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Safe & Secure</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Your privacy and security are our top priorities. We use industry-standard encryption and security measures to protect your personal information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Simple steps to find your perfect domestic helper
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {/* Step 1 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white mx-auto">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Create Your Profile</h3>
                <p className="mt-2 text-base text-gray-500">
                  Sign up in minutes and create your profile. Choose between employer or helper profile and provide your basic information.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <ul className="space-y-2">
                    <li>• Quick registration</li>
                    <li>• Basic information</li>
                    <li>• Profile verification</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white mx-auto">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Find Your Match</h3>
                <p className="mt-2 text-base text-gray-500">
                  Use our smart search filters to find helpers based on location, experience, skills, and salary expectations.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <ul className="space-y-2">
                    <li>• Advanced search filters</li>
                    <li>• View detailed profiles</li>
                    <li>• Save favorite candidates</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white mx-auto">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Hire & Begin</h3>
                <p className="mt-2 text-base text-gray-500">
                  Connect with your chosen helper, discuss terms, and complete the hiring process with our support.
                </p>
                <div className="mt-4 text-sm text-gray-500">
                  <ul className="space-y-2">
                    <li>• Direct communication</li>
                    <li>• Contract assistance</li>
                    <li>• Start working together</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-12 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Get Started Now
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Real experiences from employers and domestic helpers
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Sarah K.</h4>
                    <p className="text-sm text-gray-500">Employer</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  "Found a wonderful maid through CityMaid. The verification process gave me peace of mind, and the matching was perfect for our family's needs."
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Ram S.</h4>
                    <p className="text-sm text-gray-500">Domestic Helper</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  "CityMaid helped me find a great employer. The platform is easy to use and I feel secure knowing my profile is verified."
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900">Priya M.</h4>
                    <p className="text-sm text-gray-500">Employer</p>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">
                  "The process was smooth and professional. I found a reliable helper within days of posting my requirements."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Get answers to common questions about our services
            </p>
          </div>

          <div className="mt-10 max-w-3xl mx-auto">
            <div className="space-y-4">
              {/* FAQ Item 1 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(0)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Where is CityMaid located and is it a registered company?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 0 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 0 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      CityMaid is a registered company located at Talchhikhel 15, Satdobato, Lalitpur, Nepal. We operate with proper business registration and maintain all necessary legal compliances to ensure a trustworthy service.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 2 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(1)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">What is your service coverage area?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 1 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 1 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      We provide domestic helper services across all major cities of Nepal. Our service network is continuously expanding to serve more locations. Please contact us to confirm availability in your specific area.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 3 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(2)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">What are the salary ranges for different types of employment?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 2 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 2 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      Our salary ranges are as follows:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Full-time: NPR 15,000 - 25,000 per month</li>
                        <li>Part-time: NPR 6,000 - 14,000 per month</li>
                        <li>Live-in: NPR 15,000 - 25,000 per month</li>
                      </ul>
                      Specific rates depend on experience, skills, and working hours. We ensure fair market rates for both employers and helpers.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 4 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(3)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">What is your service charge structure?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 3 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 3 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      Our service charges are based on different plans:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Basic Plan: NPR 500</li>
                        <li>Standard Plan: NPR 1,000</li>
                        <li>Premium Plan: NPR 1,500</li>
                      </ul>
                      Each plan includes different levels of service and support. Please contact us for detailed plan features.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 5 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(4)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">What is your refund policy?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 4 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 4 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      Our refund policy is as follows:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Full refund if the helper is not available to work</li>
                        <li>No refund in cases where:
                          <ul className="ml-4 list-disc list-inside">
                            <li>Helper is available but employer disagrees on salary</li>
                            <li>Timing issues arise</li>
                            <li>Other remuneration-related issues</li>
                          </ul>
                        </li>
                        <li>All refunds are processed within 7-10 business days</li>
                      </ul>
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 6 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(5)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">What types of domestic helpers do you provide?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 5 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 5 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      We offer various types of domestic helpers including:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Full-time housekeepers</li>
                        <li>Part-time helpers</li>
                        <li>Live-in maids</li>
                        <li>Specialized caregivers</li>
                        <li>Cooks and kitchen helpers</li>
                      </ul>
                      Each helper is matched based on your specific requirements and preferences.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 7 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(6)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Do you provide services for foreign placements?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 6 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 6 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      Currently, we focus on domestic placements within Nepal. We do not provide international placement services at this time.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 8 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(7)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">How does the payment process work?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 7 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 7 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      We facilitate the initial connection between employer and helper. After the first month, all salary payments are made directly from the employer to the domestic helper. We do not handle or manage ongoing salary payments.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 9 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(8)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">How do you handle security and responsibility issues?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 8 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 8 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      We provide thorough verification of domestic helpers, but we do not take responsibility for any issues that may arise after placement. We recommend employers to:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Conduct their own due diligence</li>
                        <li>Maintain proper documentation</li>
                        <li>Set clear terms and conditions</li>
                        <li>Have proper insurance coverage</li>
                      </ul>
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 10 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(9)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">What is your verification process for domestic helpers?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 9 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 9 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      Our verification process includes:
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>Identity verification</li>
                        <li>Background checks</li>
                        <li>Reference validation</li>
                        <li>Police verification (if required)</li>
                        <li>Previous employment verification</li>
                      </ul>
                      This ensures you get reliable and trustworthy domestic help.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 11 */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <button 
                  onClick={() => toggleFaq(10)}
                  className="w-full px-6 py-4 text-left focus:outline-none hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">How can I register to find a domestic helper?</h3>
                    <svg 
                      className={`h-5 w-5 text-gray-500 transform transition-transform duration-200 ${openFaq === 10 ? 'rotate-180' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === 10 && (
                  <div className="px-6 pb-4 border-t border-gray-100">
                    <p className="text-gray-600 mt-4">
                      The registration process is simple:
                      <ol className="mt-2 list-decimal list-inside space-y-1">
                        <li>Create an account on our website</li>
                        <li>Fill in your requirements</li>
                        <li>Choose a suitable helper from our verified profiles</li>
                        <li>Complete the verification process</li>
                        <li>We'll handle the rest of the placement process</li>
                      </ol>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Still have questions?{' '}
                <Link href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
