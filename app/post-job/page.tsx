"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const jobTypes = ['Full-time', 'Part-time', 'Live-in', 'Live-out'];
const experienceLevels = ['No experience required', '1-2 years', '3-5 years', '5+ years'];
const availabilityOptions = ['Immediately', 'Within 1 week', 'Within 1 month'];
const workingHours = [
  'Morning (6AM-10AM)',
  'Morning (6AM-9AM)',
  'Morning (6AM-8AM)',
  'Morning (7AM-12PM)',
  'Morning (7AM-11AM)',
  'Morning (7AM-10AM)',
  'Morning (7AM-9AM)',
  'Afternoon (10AM-2PM)',
  'Evening (2PM-6PM)',
  '6:00 AM - 2:00 PM',
  '7:00 AM - 3:00 PM',
  '8:00 AM - 4:00 PM',
  '9:00 AM - 5:00 PM',
  '10:00 AM - 6:00 PM',
  '7:00 AM - 7:00 PM',
  '6:00 AM - 4:00 PM',
  '6:00 AM - 6:00 PM',
  '7:00 AM - 5:00 PM',
  'Flexible Hours'
];
const salaryRanges = [
  '6,000-10,000 NPR',
  '10,001-15,000 NPR',
  '15,001-20,000 NPR',
  '20,001-25,000 NPR',
  '25,001-30,000 NPR'
];
const locations = [
  'Kathmandu', 'Lalitpur', 'Bhaktapur', 'Pokhara', 'Biratnagar', 'Bharatpur', 
  'Birgunj', 'Dharan', 'Butwal', 'Hetauda', 'Dhangadhi', 
  'Nepalgunj', 'Itahari', 'Kirtipur', 'Tulsipur', 'Ghorahi', 'Tansen', 
  'Bidur', 'Gulariya', 'Rajbiraj', 'Lahan', 'Siddharthanagar', 'Tikapur',
  'Other'
];
const requiredSkills = [
  'Cooking', 'Cleaning', 'Laundry/Clothes Washing', 'Child Care', 'Elderly Care',
  'Patient Care', 'Pet Care', 'Postnatal/Sutkeri Care', 'Office Assistant', 'Gardening',
  'Ironing', 'Dishwashing',
];
const requiredLanguages = ['Nepali', 'English', 'Hindi', 'Newari', 'Tamang', 'Gurung', 'Magar', 'Maithili'];
const requiredDocuments = ['Citizen ID', 'Passport', 'Driver License', 'Other'];

export default function PostJob() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    job_title: '',
    job_type: '',
    experience_required: '',
    available_from: '',
    working_hours: '',
    salary_range: '',
    location: '',
    specific_area: '',
    required_skills: [] as string[],
    required_languages: [] as string[],
    required_documents: [] as string[],
    job_description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  // Handle input change for text/select
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Handle checkbox group for skills, languages, and documents
  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>, field: 'required_skills' | 'required_languages' | 'required_documents') {
    const { value, checked } = e.target;
    setFormData(prev => {
      const arr = new Set(prev[field]);
      if (checked) arr.add(value);
      else arr.delete(value);
      return { ...prev, [field]: Array.from(arr) };
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Please sign in to post a job');
      }

      const { error: submitError } = await supabase
        .from('jobs')
        .insert([
          {
            ...formData,
            user_id: user.id,
          }
        ]);

      if (submitError) throw submitError;

      router.push('/find-jobs');
    } catch (err) {
      console.error('Error posting job:', err);
      setError(err instanceof Error ? err.message : 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 border border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900 mb-8 pb-4 border-b border-gray-200">Post a Job</h1>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Job Title *</label>
                <input
                  type="text"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="e.g., Full-time Housekeeper"
                  aria-label="Job title"
                  title="Enter the job title"
                />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Job Type *</label>
                <select
                  name="job_type"
                  value={formData.job_type}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select job type"
                  title="Select job type"
                >
                  <option value="">Select Job Type</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Experience Required *</label>
                <select
                  name="experience_required"
                  value={formData.experience_required}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select experience level"
                  title="Select experience level"
                >
                  <option value="">Select Experience Level</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Available From *</label>
                <select
                  name="available_from"
                  value={formData.available_from}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select availability"
                  title="Select availability"
                >
                  <option value="">Select Availability</option>
                  {availabilityOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Work Details */}
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Work Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Working Hours *</label>
                <select
                  name="working_hours"
                  value={formData.working_hours}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select working hours"
                  title="Select working hours"
                >
                  <option value="">Select Working Hours</option>
                  {workingHours.map(hours => (
                    <option key={hours} value={hours}>{hours}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Salary Range (NPR) *</label>
                <select
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select salary range"
                  title="Select salary range"
                >
                  <option value="">Select Salary Range</option>
                  {salaryRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Location Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Location *</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select location"
                  title="Select location"
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Specific Area/Tole</label>
                <input
                  type="text"
                  name="specific_area"
                  value={formData.specific_area}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter specific area or tole"
                  aria-label="Specific area or tole"
                  title="Enter the specific area or tole"
                />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Requirements</h2>
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Required Skills *</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {requiredSkills.map(skill => (
                    <label key={skill} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={skill}
                        checked={formData.required_skills.includes(skill)}
                        onChange={e => handleCheckboxChange(e, 'required_skills')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        aria-label={`Select ${skill}`}
                        title={`Select ${skill}`}
                      />
                      <span className="text-sm text-gray-900">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Required Languages *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {requiredLanguages.map(lang => (
                    <label key={lang} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={lang}
                        checked={formData.required_languages.includes(lang)}
                        onChange={e => handleCheckboxChange(e, 'required_languages')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        aria-label={`Select ${lang}`}
                        title={`Select ${lang}`}
                      />
                      <span className="text-sm text-gray-900">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Required Documents *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {requiredDocuments.map(doc => (
                    <label key={doc} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={doc}
                        checked={formData.required_documents.includes(doc)}
                        onChange={e => handleCheckboxChange(e, 'required_documents')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        aria-label={`Select ${doc}`}
                        title={`Select ${doc}`}
                      />
                      <span className="text-sm text-gray-900">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-2">Job Description *</label>
            <div className="relative bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <textarea
                name="job_description"
                value={formData.job_description}
                onChange={handleChange}
                rows={4}
                required
                minLength={20}
                maxLength={500}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                placeholder="Describe the job responsibilities, working conditions, and any other important details..."
                aria-label="Job description"
                title="Enter the job description"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                <span>{formData.job_description.length}</span>/500
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Contact Name *</label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter your name"
                  aria-label="Contact name"
                  title="Enter the contact name"
                />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Contact Phone *</label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter your phone number"
                  aria-label="Contact phone"
                  title="Enter the contact phone number"
                />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Contact Email *</label>
                <input
                  type="email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter your email"
                  aria-label="Contact email"
                  title="Enter the contact email"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
