'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const ageGroups = ['18-25', '26-35', '36-45', '46+'];
const genders = ['Male', 'Female', 'Other'];
const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed'];
const experienceOptions = ['No experience/Freshers', '1-2 years', '3-5 years', '5+ years'];
const availabilityOptions = ['Immediately', 'Within 1 week', 'Within 1 month'];
const preferredTimes = [
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
const expectedSalaries = [
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
const nationalities = ['Nepali', 'Indian', 'Other'];
const religions = ['Hindu', 'Muslim', 'Christian', 'Buddhist', 'Not to Say'];
const educationLevels = ['Under SEE Pass', 'SEE Pass', 'Plus 2 Pass', 'Bachelor Pass or More'];
const documents = ['Citizen ID', 'Passport', 'Driver License', 'Other'];
const languages = ['Nepali', 'English', 'Hindi', 'Newari', 'Tamang', 'Gurung', 'Magar', 'Maithili'];
const skillsList = [
  'Cooking', 'Cleaning', 'Laundry/Clothes Washing', 'Child Care', 'Elderly Care',
  'Patient Care', 'Pet Care', 'Postnatal/Sutkeri Care', 'Office Assistant', 'Gardening',
  'Ironing', 'Dishwashing',
];

export default function MaidProfile() {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Maximum file size (2MB)
  const MAX_FILE_SIZE = 2 * 1024 * 1024;

  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    age_group: '',
    gender: '',
    marital_status: '',
    email: '',
    phone: '',
    years_experience: '',
    available_from: '',
    preferred_working_time: '',
    expected_salary: '',
    preferred_location: '',
    specific_area: '',
    nationality: '',
    religion: '',
    education_level: '',
    available_documents: '',
    languages_spoken: [] as string[],
    skills: [] as string[],
    about_me: '',
    photo_url: '',
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('maids')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          return;
        }

        if (profile) {
          console.log('Loading existing profile:', profile);
          setFormData({
            full_name: profile.full_name || '',
            age_group: profile.age_group || '',
            gender: profile.gender || '',
            marital_status: profile.marital_status || '',
            email: profile.email || '',
            phone: profile.phone || '',
            years_experience: profile.years_experience || '',
            available_from: profile.available_from ? 'Immediately' : '', // Convert timestamp to text
            preferred_working_time: profile.preferred_working_time || '',
            expected_salary: profile.expected_salary || '',
            preferred_location: profile.preferred_location || '',
            specific_area: profile.specific_area || '',
            nationality: profile.nationality || '',
            religion: profile.religion || '',
            education_level: profile.education_level || '',
            available_documents: profile.available_documents || '',
            languages_spoken: profile.languages_spoken || [],
            skills: profile.skills || [],
            about_me: profile.about_me || '',
            photo_url: profile.photo_url || '',
          });
          setPhotoUrl(profile.photo_url || null);
        }
      } catch (error) {
        console.error('Error in loadProfile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  // Handle input change for text/select
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  // Handle checkbox group for languages and skills
  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>, field: 'languages_spoken' | 'skills') {
    const { value, checked } = e.target;
    setFormData(prev => {
      const arr = new Set(prev[field]);
      if (checked) arr.add(value);
      else arr.delete(value);
      return { ...prev, [field]: Array.from(arr) };
    });
  }

  // Upload photo handler
  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      setUploadError('Please select an image to upload.');
      return;
    }

    const file = event.target.files[0];
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size should be less than 2MB');
      setPreviewUrl(null);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file');
      setPreviewUrl(null);
      return;
    }

    setUploadError(null);
    
    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    try {
      setUploading(true);

      // Generate a unique file name
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('maid-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting existing files
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload file');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('maid-photos')
        .getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Verify the file exists
      const { data: fileExists, error: fileCheckError } = await supabase.storage
        .from('maid-photos')
        .list('', {
          search: fileName
        });

      if (fileCheckError || !fileExists || fileExists.length === 0) {
        throw new Error('File upload verification failed');
      }

      console.log('Photo uploaded successfully:', publicUrl);
      setPhotoUrl(publicUrl);
      setFormData(prev => ({ ...prev, photo_url: publicUrl }));
      setUploadError(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload photo. Please try again.');
      setPreviewUrl(null);
      setPhotoUrl(null);
    } finally {
      setUploading(false);
    }
  };

  // Cleanup preview URL when component unmounts or when photo is successfully uploaded
  React.useEffect(() => {
    return () => {
      if (previewUrl && !photoUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, photoUrl]);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoUrl) {
      setUploadError('Please upload a photo first.');
      return;
    }

    // Basic validation example: check required fields
    if (!formData.full_name || !formData.email || !formData.phone) {
      alert('Please fill all required fields: Full Name, Email, Phone');
      return;
    }

    try {
      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No authenticated user found');

      console.log('Submitting form data:', formData);
      
      // Prepare the data according to the table structure
      const maidData: {
        id: string;  // Add the id field
        full_name: string;
        age_group: string;
        gender: string;
        photo_url: string;
        preferred_location: string;
        years_experience: string;
        skills: string[];
        expected_salary: string;
        email: string;
        phone: string;
        marital_status: string;
        available_from: string;
        preferred_working_time: string;
        specific_area: string | null;
        nationality: string;
        religion: string | null;
        education_level: string;
        available_documents: string;
        languages_spoken: string[];
        about_me: string;
      } = {
        id: user.id,  // Set the user's ID
        full_name: formData.full_name.trim(),
        age_group: formData.age_group,
        gender: formData.gender,
        photo_url: photoUrl,
        preferred_location: formData.preferred_location,
        years_experience: formData.years_experience,
        skills: Array.isArray(formData.skills) ? formData.skills : [],
        expected_salary: formData.expected_salary,
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        marital_status: formData.marital_status,
        available_from: new Date().toISOString(), // Always set to current time for now
        preferred_working_time: formData.preferred_working_time,
        specific_area: formData.specific_area?.trim() || null,
        nationality: formData.nationality,
        religion: formData.religion || null,
        education_level: formData.education_level,
        available_documents: formData.available_documents,
        languages_spoken: Array.isArray(formData.languages_spoken) ? formData.languages_spoken : [],
        about_me: formData.about_me.trim()
      };

      // Validate arrays are not empty
      if (maidData.skills.length === 0) {
        throw new Error('Please select at least one skill');
      }
      if (maidData.languages_spoken.length === 0) {
        throw new Error('Please select at least one language');
      }

      // Validate required fields
      const requiredFields = [
        'full_name', 'age_group', 'gender', 'marital_status', 'email', 'phone',
        'years_experience', 'available_from', 'preferred_working_time', 'expected_salary',
        'preferred_location', 'nationality', 'education_level', 'available_documents', 'about_me'
      ] as const;

      for (const field of requiredFields) {
        if (!maidData[field]) {
          throw new Error(`Please fill in the ${field.replace(/_/g, ' ')} field`);
        }
      }

      console.log('Prepared maid data:', maidData);
      
      // First, check if a profile already exists for this user
      const { data: existingProfile, error: checkError } = await supabase
        .from('maids')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Profile check error:', checkError);
        throw new Error(`Error checking existing profile: ${checkError.message}`);
      }

      let result;
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile...');
        const { data, error } = await supabase
          .from('maids')
          .update(maidData)
          .eq('id', user.id)
          .select('*');
        
        if (error) {
          console.error('Profile update error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        result = data;
      } else {
        // Insert new profile
        console.log('Creating new profile...');
        const { data, error } = await supabase
          .from('maids')
          .insert([maidData])
          .select('*');
        
        if (error) {
          console.error('Profile creation error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        result = data;
      }

      if (!result || result.length === 0) {
        throw new Error('No data returned from server');
      }

      console.log('Profile saved successfully:', result);
      alert('Profile saved successfully!');
      
      // Redirect to dashboard after successful profile creation/update
      router.push('/maid-dashboard');
      
      // Reset form
      setFormData({
        full_name: '',
        age_group: '',
        gender: '',
        marital_status: '',
        email: '',
        phone: '',
        years_experience: '',
        available_from: '',
        preferred_working_time: '',
        expected_salary: '',
        preferred_location: '',
        specific_area: '',
        nationality: '',
        religion: '',
        education_level: '',
        available_documents: '',
        languages_spoken: [],
        skills: [],
        about_me: '',
        photo_url: '',
      });
      setPhotoUrl(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error('Detailed error in profile creation:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack
      });
      alert('Error creating profile: ' + (error?.message || 'Unknown error occurred'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Create Your Profile
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Fill out your details to start finding domestic work opportunities.
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/');
          }}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          {/* Profile Photo */}
          <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-900">Profile Photo *</label>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-blue-600">
                  {!previewUrl && !photoUrl && (
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="mt-1 text-xs text-gray-600">Click to upload</p>
                      <p className="text-xs text-gray-500">Max size: 2MB</p>
                    </div>
                  )}
                  {(previewUrl || photoUrl) && (
                    <img
                      src={previewUrl || photoUrl || ''}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={uploadPhoto}
                  disabled={uploading}
                  className="hidden"
                  aria-label="Upload profile photo"
                  title="Upload profile photo"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('photo')?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-lg transition-all duration-200"
                  aria-label="Upload photo"
                  title="Upload photo"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">Click the camera icon to upload your photo</p>
                <p className="text-xs text-gray-500">Upload a clear face photo to increase your chances of getting hired</p>
              </div>
            </div>
            {uploading && (
              <div className="mt-2 flex items-center gap-2 text-blue-600">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Uploading...</span>
              </div>
            )}
            {uploadError && (
              <div className="mt-2 text-sm text-red-600">
                {uploadError}
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  pattern="[A-Za-z\s]+"
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter your full name as per documents"
                />
                <p className="text-xs text-gray-500 mt-1">3-50 characters, letters only</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Age Group *</label>
                <select
                  name="age_group"
                  value={formData.age_group}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select age group"
                >
                  <option value="">Select Age Group</option>
                  {ageGroups.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select gender"
                >
                  <option value="">Select Gender</option>
                  {genders.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Marital Status *</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select marital status"
                >
                  <option value="">Select Status</option>
                  {maritalStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter your active email address"
                />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Enter your active phone number"
                />
                <p className="text-xs text-gray-500 mt-1">10 digits only</p>
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Work Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Years of Experience *</label>
                <select
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select years of experience"
                >
                  <option value="">Select Experience</option>
                  {experienceOptions.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
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
                >
                  <option value="">Select Availability</option>
                  {availabilityOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">When can you start working?</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Working Time *</label>
                <select
                  name="preferred_working_time"
                  value={formData.preferred_working_time}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select preferred working time"
                >
                  <option value="">Select Preferred Time</option>
                  {preferredTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Expected Monthly Salary (NPR) *</label>
                <select
                  name="expected_salary"
                  value={formData.expected_salary}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select expected salary"
                >
                  <option value="">Select Expected Salary</option>
                  {expectedSalaries.map(sal => (
                    <option key={sal} value={sal}>{sal}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Location Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Preferred Work Location *</label>
                <select
                  name="preferred_location"
                  value={formData.preferred_location}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select preferred work location"
                >
                  <option value="">Select Major City</option>
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
                  placeholder="Enter specific area or tole (e.g., Baneshwor, Patan, etc.)"
                />
                <p className="text-xs text-gray-500 mt-1">Please specify the exact area or tole where you prefer to work</p>
              </div>
            </div>
          </div>

          {/* Background Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Background Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Nationality *</label>
                <select
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select nationality"
                >
                  <option value="">Select Nationality</option>
                  {nationalities.map(nat => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Religion</label>
                <select
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select religion"
                >
                  <option value="">Select Religion</option>
                  {religions.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Education Level *</label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select education level"
                >
                  <option value="">Select Education Level</option>
                  {educationLevels.map(ed => (
                    <option key={ed} value={ed}>{ed}</option>
                  ))}
                </select>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Available Documents *</label>
                <select
                  name="available_documents"
                  value={formData.available_documents}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  aria-label="Select available documents"
                >
                  <option value="">Select Available Documents</option>
                  {documents.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Languages and Skills */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">Languages and Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Languages Spoken *</label>
                <p className="text-xs text-gray-500 mb-4">Select all languages you can speak</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {languages.map(lang => (
                    <label key={lang} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={lang}
                        checked={formData.languages_spoken.includes(lang)}
                        onChange={e => handleCheckboxChange(e, 'languages_spoken')}
                        required={formData.languages_spoken.length === 0}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-sm text-gray-900">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <label className="block text-sm font-medium text-gray-900 mb-2">Skills *</label>
                <p className="text-xs text-gray-500 mb-4">Select all services you can provide</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {skillsList.map(skill => (
                    <label key={skill} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={skill}
                        checked={formData.skills.includes(skill)}
                        onChange={e => handleCheckboxChange(e, 'skills')}
                        required={formData.skills.length === 0}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <span className="text-sm text-gray-900">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 pb-2 border-b border-gray-200">About Me</h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-medium text-gray-900 mb-2">About Me *</label>
              <div className="relative">
                <textarea
                  name="about_me"
                  value={formData.about_me}
                  onChange={handleChange}
                  rows={4}
                  required
                  minLength={20}
                  maxLength={250}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-600 focus:ring-blue-600"
                  placeholder="Tell employers about yourself, your experience, and what makes you a great domestic helper (max 250 characters)"
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                  <span>{formData.about_me.length}</span>/250
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={uploading || loading}
            >
              {loading ? 'Loading...' : photoUrl ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
