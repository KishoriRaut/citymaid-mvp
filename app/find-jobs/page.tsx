'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Job {
  id: string
  title: string
  location: string
  salary: string
  requirements: string[]
  description: string
  contact_name: string
  contact_phone: string
  created_at: string
}

export default function FindJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setError('Failed to load jobs. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Find Domestic Work
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Browse through available domestic work opportunities in your area.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {job.location}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Salary:</span> {job.salary}
                </p>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Requirements:</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.requirements.map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {job.description}
                </p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Posted by: {job.contact_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Posted: {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
