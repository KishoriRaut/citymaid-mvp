'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface MaidProfile {
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
  status: 'active' | 'inactive'
  profile_completion: number
  is_public: boolean
  marital_status: string
  email: string
  phone: string
  available_from: string
  preferred_working_time: string
}

interface DashboardStats {
  profileViews: number
  employerUnlocks: number
  maidUnlocks: number
}

interface ContactUnlock {
  id: string
  employer_name: string
  unlock_date: string
  status: 'completed' | 'pending'
  type: 'employer_unlock' | 'maid_unlock'
}

interface JobPost {
  id: string
  title: string
  employer_name: string
  location: string
  salary: string
  posted_date: string
  status: 'active' | 'filled'
  contact_unlocked: boolean
}

interface AdminMessage {
  id: string;
  admin_id: string;
  user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_type: 'admin' | 'user';
}

export default function MaidDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<MaidProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    employerUnlocks: 0,
    maidUnlocks: 0
  })
  const [recentUnlocks, setRecentUnlocks] = useState<ContactUnlock[]>([])
  const [recentJobs, setRecentJobs] = useState<JobPost[]>([])
  const [user, setUser] = useState<any>(null)
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false)
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    checkUser()
  }, [router])

  useEffect(() => {
    if (user) {
      fetchAdminMessages();
    }
  }, [user]);

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      await fetchProfile()
      await fetchRecentUnlocks()
      await fetchRecentJobs()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No user found')
        return
      }

      console.log('Fetching profile for user:', user.id)

      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('maids')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (checkError) {
        console.error('Error checking profile:', checkError)
        throw checkError
      }

      console.log('Existing profile data:', existingProfile)

      if (!existingProfile) {
        console.log('No profile found, creating new profile')
        // Create a new profile if it doesn't exist
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: '',
          age_group: '',
          gender: '',
          years_experience: '',
          preferred_location: '',
          skills: [],
          expected_salary: '',
          photo_url: '',
          created_at: new Date().toISOString(),
          status: 'inactive',
          is_public: true,
          marital_status: 'single',
          phone: '',
          available_from: new Date().toISOString(),
          preferred_working_time: 'full-time'
        }

        console.log('Attempting to create profile with data:', JSON.stringify(newProfile, null, 2))

        try {
          // First try to insert without select
          const { error: insertError } = await supabase
            .from('maids')
            .insert([newProfile])

          if (insertError) {
            console.error('Error creating profile:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            })
            throw insertError
          }

          // Then fetch the created profile
          const { data: fetchedProfile, error: fetchError } = await supabase
            .from('maids')
            .select('*')
            .eq('id', user.id)
            .single()

          if (fetchError) {
            console.error('Error fetching created profile:', {
              message: fetchError.message,
              details: fetchError.details,
              hint: fetchError.hint,
              code: fetchError.code
            })
            throw fetchError
          }

          console.log('Created and fetched profile:', fetchedProfile)
          setProfile(fetchedProfile)
        } catch (error: any) {
          console.error('Detailed error in profile creation:', {
            message: error?.message,
            details: error?.details,
            hint: error?.hint,
            code: error?.code,
            stack: error?.stack
          })
          throw error
        }
      } else {
        console.log('Found existing profile:', existingProfile)
        setProfile(existingProfile)
      }

      await fetchStats(user.id)
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setProfile(null)
    }
  }

  const fetchStats = async (userId: string) => {
    try {
      // TODO: Implement actual stats fetching from database
      setStats({
        profileViews: 45,
        employerUnlocks: 5,
        maidUnlocks: 3
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentUnlocks = async () => {
    try {
      // TODO: Implement actual unlocks fetching from database
      setRecentUnlocks([
        {
          id: '1',
          employer_name: 'John Doe',
          unlock_date: '2024-03-15',
          status: 'completed',
          type: 'employer_unlock'
        },
        {
          id: '2',
          employer_name: 'Jane Smith',
          unlock_date: '2024-03-10',
          status: 'completed',
          type: 'maid_unlock'
        }
      ])
    } catch (error) {
      console.error('Error fetching unlocks:', error)
    }
  }

  const fetchRecentJobs = async () => {
    try {
      // TODO: Implement actual jobs fetching from database
      setRecentJobs([
        {
          id: '1',
          title: 'Full-time Housekeeper',
          employer_name: 'John Doe',
          location: 'New York',
          salary: '$2000/month',
          posted_date: '2024-03-15',
          status: 'active',
          contact_unlocked: false
        },
        {
          id: '2',
          title: 'Part-time Maid',
          employer_name: 'Jane Smith',
          location: 'Los Angeles',
          salary: '$1500/month',
          posted_date: '2024-03-10',
          status: 'active',
          contact_unlocked: true
        }
      ])
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchAdminMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminMessages(data || []);
    } catch (error) {
      console.error('Error fetching admin messages:', error);
    }
  };

  const sendMessageToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const { error } = await supabase.from('admin_messages').insert([
        {
          user_id: user.id,
          content: newMessage.trim(),
          sender_type: 'user'
        },
      ]);

      if (error) throw error;

      setNewMessage('');
      fetchAdminMessages();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const calculateProfileCompletion = (profile: MaidProfile) => {
    let completion = 0
    const fields = [
      'full_name',
      'age_group',
      'gender',
      'years_experience',
      'preferred_location',
      'skills',
      'expected_salary',
      'photo_url'
    ] as const
    
    fields.forEach(field => {
      if (profile[field]) completion += 12.5 // 100/8 fields
    })
    
    return Math.round(completion)
  }

  const toggleProfileVisibility = async () => {
    if (!profile) return
    
    try {
      setIsUpdatingVisibility(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      const newVisibility = !profile.is_public
      
      const { data: updatedProfile, error } = await supabase
        .from('maids')
        .update({ is_public: newVisibility })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(prev => {
        if (!prev) return null
        return { ...prev, is_public: newVisibility }
      })
    } catch (error) {
      console.error('Error updating profile visibility:', error)
    } finally {
      setIsUpdatingVisibility(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0

  return (
    <div className="space-y-6">
      {/* Welcome Section with Profile Visibility */}
      <div className="flex justify-between items-start">
        <div className="bg-white shadow rounded-lg p-6 flex-1 mr-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {profile?.full_name || 'Maid'}
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your profile and track your job opportunities.
          </p>
        </div>

        {/* Profile Visibility Toggle */}
        {profile && (
          <div className="bg-white shadow rounded-lg p-4 w-64">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {profile.is_public 
                    ? 'Visible to employers' 
                    : 'Hidden from employers'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleProfileVisibility}
                disabled={isUpdatingVisibility}
                aria-label={profile.is_public ? 'Hide profile from employers' : 'Make profile visible to employers'}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  profile.is_public ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    profile.is_public ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {isUpdatingVisibility && (
              <p className="text-sm text-gray-500 mt-2">Updating...</p>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/find-jobs"
          className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Find Jobs</h3>
              <p className="text-sm text-gray-500">Browse available positions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/maid-profile"
          className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Update Profile</h3>
              <p className="text-sm text-gray-500">Manage your information</p>
            </div>
          </div>
        </Link>

        <Link
          href={`/maid-details/${profile?.id}`}
          className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">View Profile</h3>
              <p className="text-sm text-gray-500">See how employers see you</p>
            </div>
          </div>
        </Link>

        <Link
          href="/messages"
          className="bg-white shadow rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Messages</h3>
              <p className="text-sm text-gray-500">Check your inbox</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Profile Views</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.profileViews}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Employer Unlocks</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.employerUnlocks}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Your Unlocks</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.maidUnlocks}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Job Posts</h3>
          <p className="mt-1 text-sm text-gray-500">Latest job opportunities in your area</p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {recentJobs.map((job) => (
              <li key={job.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-600 truncate">{job.title}</p>
                    <p className="text-sm text-gray-500">Employer: {job.employer_name}</p>
                    <p className="text-sm text-gray-500">Location: {job.location}</p>
                    <p className="text-sm text-gray-500">Salary: {job.salary}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    {job.contact_unlocked ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Contact Unlocked
                      </span>
                    ) : (
                      <button
                        onClick={() => router.push(`/job-details/${job.id}`)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Posted on {new Date(job.posted_date).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
          <Link
            href="/find-jobs"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all jobs →
          </Link>
        </div>
      </div>

      {/* Recent Unlocks Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Employer Unlocks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Employers Who Unlocked You</h3>
            <p className="mt-1 text-sm text-gray-500">Employers who paid to contact you</p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {recentUnlocks
                .filter(unlock => unlock.type === 'employer_unlock')
                .map((unlock) => (
                  <li key={unlock.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{unlock.employer_name}</p>
                          <p className="text-sm text-gray-500">Unlocked on {new Date(unlock.unlock_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          unlock.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {unlock.status.charAt(0).toUpperCase() + unlock.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              {recentUnlocks.filter(unlock => unlock.type === 'employer_unlock').length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No employers have unlocked your contact yet
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Maid Unlocks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Contact Unlocks</h3>
            <p className="mt-1 text-sm text-gray-500">Employers you paid to contact</p>
          </div>
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {recentUnlocks
                .filter(unlock => unlock.type === 'maid_unlock')
                .map((unlock) => (
                  <li key={unlock.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{unlock.employer_name}</p>
                          <p className="text-sm text-gray-500">Unlocked on {new Date(unlock.unlock_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          unlock.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {unlock.status.charAt(0).toUpperCase() + unlock.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              {recentUnlocks.filter(unlock => unlock.type === 'maid_unlock').length === 0 && (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  You haven't unlocked any employer contacts yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Admin Messages Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Messages with Admin</h2>
        {adminMessages.length === 0 ? (
          <p className="text-gray-500">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {adminMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-gray-900">{message.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Message Input */}
        <form onSubmit={sendMessageToAdmin} className="mt-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message to admin..."
              className="flex-1 rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>

      {/* Profile Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h2>
        {profile ? (
          <div className="space-y-6">
            {/* Profile Completion */}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Profile Completion</h3>
              <div className="mt-2">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                        {profileCompletion}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div
                      style={{ width: `${profileCompletion}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="border-t border-gray-200 pt-4">
              <Link
                href="/maid-profile"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {profileCompletion < 100 ? 'Complete Profile' : 'Update Profile'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">You haven't created your profile yet.</p>
            <Link
              href="/maid-profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 