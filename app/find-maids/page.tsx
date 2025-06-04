'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import PlaceholderProfile from '@/components/PlaceholderProfile';
import Link from 'next/link';

interface Maid {
  id: string;
  full_name: string;
  age_group: string;
  gender: string;
  photo_url: string;
  preferred_location: string;
  years_experience: string;
  skills: string[];
  expected_salary: string;
  available_from: string;
  preferred_working_time: string;
  specific_area: string;
  nationality: string;
  education_level: string;
  languages_spoken: string[];
  about_me: string;
}

interface Filters {
  search: string;
  location: string;
  experience: string;
  salary: string;
  gender: string;
  ageGroup: string;
  skills: string[];
  languages: string[];
  education: string;
  nationality: string;
  availableFrom: string;
  workingTime: string;
}

export default function FindMaids() {
  const [maids, setMaids] = useState<Maid[]>([]);
  const [filteredMaids, setFilteredMaids] = useState<Maid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    location: '',
    experience: '',
    salary: '',
    gender: '',
    ageGroup: '',
    skills: [],
    languages: [],
    education: '',
    nationality: '',
    availableFrom: '',
    workingTime: ''
  });

  // Predefined options for filters
  const filterOptions = {
    locations: ['Kathmandu', 'Lalitpur', 'Bhaktapur', 'Other'],
    experiences: ['0-1 years', '1-3 years', '3-5 years', '5+ years'],
    salaryRanges: ['Below 15,000', '15,000-20,000', '20,000-25,000', '25,000+'],
    genders: ['Male', 'Female'],
    ageGroups: ['18-25', '26-35', '36-45', '46+'],
    skills: ['Cooking', 'Cleaning', 'Childcare', 'Elderly Care', 'Pet Care', 'Laundry', 'Ironing'],
    languages: ['Nepali', 'English', 'Hindi', 'Newari', 'Other'],
    educationLevels: ['High School', 'Intermediate', 'Bachelor', 'Master', 'Other'],
    nationalities: ['Nepali', 'Indian', 'Other'],
    workingTimes: ['Full Time', 'Part Time', 'Flexible']
  };

  useEffect(() => {
    fetchMaids();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, maids]);

  const fetchMaids = async () => {
    try {
      const { data, error } = await supabase
        .from('maids')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedData = data?.map(maid => {
        if (maid.photo_url) {
          const cleanUrl = maid.photo_url.replace(/^@/, '').trim();
          if (cleanUrl.startsWith('https://') && cleanUrl.includes('supabase.co/storage/v1/object/public')) {
            return { ...maid, photo_url: cleanUrl };
          }
          try {
            const { data: { publicUrl } } = supabase.storage
              .from('maid-photos')
              .getPublicUrl(cleanUrl);
            return { ...maid, photo_url: publicUrl };
          } catch (urlError) {
            console.error('Error in getPublicUrl:', urlError);
            return maid;
          }
        }
        return maid;
      }) || [];
      
      setMaids(processedData);
      setFilteredMaids(processedData);
    } catch (error) {
      console.error('Error fetching maids:', error);
      setError('Failed to load maids. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...maids];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(maid => 
        maid.full_name.toLowerCase().includes(searchLower) ||
        maid.about_me?.toLowerCase().includes(searchLower) ||
        maid.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Apply other filters
    if (filters.location) {
      filtered = filtered.filter(maid => 
        maid.preferred_location === filters.location ||
        maid.specific_area?.includes(filters.location)
      );
    }

    if (filters.experience) {
      filtered = filtered.filter(maid => maid.years_experience === filters.experience);
    }

    if (filters.salary) {
      filtered = filtered.filter(maid => maid.expected_salary === filters.salary);
    }

    if (filters.gender) {
      filtered = filtered.filter(maid => maid.gender === filters.gender);
    }

    if (filters.ageGroup) {
      filtered = filtered.filter(maid => maid.age_group === filters.ageGroup);
    }

    if (filters.skills.length > 0) {
      filtered = filtered.filter(maid => 
        filters.skills.some(skill => maid.skills.includes(skill))
      );
    }

    if (filters.languages.length > 0) {
      filtered = filtered.filter(maid => 
        filters.languages.some(lang => maid.languages_spoken.includes(lang))
      );
    }

    if (filters.education) {
      filtered = filtered.filter(maid => maid.education_level === filters.education);
    }

    if (filters.nationality) {
      filtered = filtered.filter(maid => maid.nationality === filters.nationality);
    }

    if (filters.availableFrom) {
      filtered = filtered.filter(maid => maid.available_from === filters.availableFrom);
    }

    if (filters.workingTime) {
      filtered = filtered.filter(maid => maid.preferred_working_time === filters.workingTime);
    }

    setFilteredMaids(filtered);
  };

  const handleFilterChange = (key: keyof Filters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      location: '',
      experience: '',
      salary: '',
      gender: '',
      ageGroup: '',
      skills: [],
      languages: [],
      education: '',
      nationality: '',
      availableFrom: '',
      workingTime: ''
    });
  };

  const handleImageLoad = (photoUrl: string) => {
    setLoadedImages(prev => ({ ...prev, [photoUrl]: true }));
  };

  const handleImageError = (photoUrl: string) => {
    setImageLoadErrors(prev => ({ ...prev, [photoUrl]: true }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Find Domestic Helpers
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Browse through our verified domestic helpers and find the perfect match for your home.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, skills, or description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Location</option>
                  {filterOptions.locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <select
                  value={filters.experience}
                  onChange={(e) => handleFilterChange('experience', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Experience</option>
                  {filterOptions.experiences.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>

              {/* Salary Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
                <select
                  value={filters.salary}
                  onChange={(e) => handleFilterChange('salary', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Salary</option>
                  {filterOptions.salaryRanges.map(range => (
                    <option key={range} value={range}>{range}</option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Gender</option>
                  {filterOptions.genders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              {/* Age Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age Group</label>
                <select
                  value={filters.ageGroup}
                  onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Age</option>
                  {filterOptions.ageGroups.map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
              </div>

              {/* Education Level Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                <select
                  value={filters.education}
                  onChange={(e) => handleFilterChange('education', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Education</option>
                  {filterOptions.educationLevels.map(edu => (
                    <option key={edu} value={edu}>{edu}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Skills Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.skills.map(skill => (
                  <label key={skill} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.skills.includes(skill)}
                      onChange={(e) => {
                        const newSkills = e.target.checked
                          ? [...filters.skills, skill]
                          : filters.skills.filter(s => s !== skill);
                        handleFilterChange('skills', newSkills);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Languages Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
              <div className="flex flex-wrap gap-2">
                {filterOptions.languages.map(language => (
                  <label key={language} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.languages.includes(language)}
                      onChange={(e) => {
                        const newLanguages = e.target.checked
                          ? [...filters.languages, language]
                          : filters.languages.filter(l => l !== language);
                        handleFilterChange('languages', newLanguages);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing {filteredMaids.length} of {maids.length} results
        </p>
      </div>

      {/* Maids Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMaids.map((maid) => {
          const photoUrl = maid.photo_url?.replace(/^@/, '').trim();
          
          return (
            <div key={maid.id} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <div className="aspect-w-3 aspect-h-2 relative bg-gray-100">
                {photoUrl && !imageLoadErrors[photoUrl] ? (
                  <div className="relative w-full h-48">
                    {!loadedImages[photoUrl] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    <img
                      src={photoUrl}
                      alt={maid.full_name}
                      className={`w-full h-48 object-cover transition-opacity duration-300 ${
                        loadedImages[photoUrl] ? 'opacity-100' : 'opacity-0'
                      }`}
                      onLoad={() => handleImageLoad(photoUrl)}
                      onError={() => handleImageError(photoUrl)}
                      loading="eager"
                      crossOrigin="anonymous"
                    />
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center bg-gray-50">
                    <PlaceholderProfile />
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{maid.full_name}</h3>
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Age:</span> {maid.age_group}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Experience:</span> {maid.years_experience}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Location:</span> {maid.preferred_location}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Salary:</span> {maid.expected_salary}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Top Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {maid.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                      {maid.skills.length > 3 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{maid.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/maid-details/${maid.id}`}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center block"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results Message */}
      {filteredMaids.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No maids found matching your criteria.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
