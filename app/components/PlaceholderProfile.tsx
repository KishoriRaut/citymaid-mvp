import React from 'react';
import Image from 'next/image';

const PlaceholderProfile: React.FC = () => {
  return (
    <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
      <Image
        src="/placeholder-profile.svg"
        alt="Profile Placeholder"
        fill
        className="object-cover"
        priority
      />
    </div>
  );
};

export default PlaceholderProfile; 