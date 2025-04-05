import React from 'react';
import Spline from '@splinetool/react-spline';

const SplineBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full z-0">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b3030]/80 via-transparent to-[#0b3030]/80" />
      
      {/* Spline scene */}
      <div className="absolute inset-0 w-full h-full">
        <Spline 
          scene="https://prod.spline.design/BGTJobSX3FzdZ6jR/scene.splinecode"
          className="w-full h-full"
        />
      </div>
    </div>
  );
};

export default SplineBackground;