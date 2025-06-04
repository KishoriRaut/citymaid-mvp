'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'
import Footer from '../../components/Footer'

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
  education_level: string;
  religion: string;
  preferred_working_time: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function MaidDetailsPage({ params }: { params: any }) {
  const [maid, setMaid] = useState<Maid | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaid() {
      const { data, error } = await supabase.from('maids').select('*').eq('id', params.id).single();
      if (error) {
        setMaid(null);
      } else {
        setMaid(data);
      }
      setLoading(false);
    }
    fetchMaid();
  }, [params.id]);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Loading...</h1>
      </main>
    );
  }

  if (!maid) {
    return (
      <>
        <main className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Maid Not Found</h1>
          <p>Sorry, no maid found with this ID.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{maid.full_name}</h1>
        <p>Age Group: {maid.age_group}</p>
        <p>Gender: {maid.gender}</p>
        <p>Location: {maid.preferred_location}</p>
        <p>Experience: {maid.years_experience}</p>
        <p>Education: {maid.education_level}</p>
        <p>Religion: {maid.religion}</p>
        <p>Preferred Work Time: {maid.preferred_working_time}</p>
        <p>Expected Salary: {maid.expected_salary}</p>
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Skills:</h2>
          <div className="flex flex-wrap gap-2">
            {maid.skills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
