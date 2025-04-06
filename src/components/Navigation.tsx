import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Upload, Shield, Settings } from 'lucide-react';

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0b3030]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-white font-bold text-xl tracking-tight hover:text-primary-light transition-colors"
            >
              DocCrypts
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2">
            <NavLink to="/" icon={<FileCheck className="w-4 h-4" />}>
              Verify
            </NavLink>
            <NavLink to="/user" icon={<Upload className="w-4 h-4" />}>
              Upload
            </NavLink>
            <NavLink to="/verifier" icon={<Shield className="w-4 h-4" />}>
              Verify Documents
            </NavLink>
            <NavLink to="/admin" icon={<Settings className="w-4 h-4" />}>
              Admin
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Helper component for navigation links
const NavLink = ({ to, children, icon }: { to: string; children: React.ReactNode; icon: React.ReactNode }) => (
  <Link 
    to={to} 
    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white 
               bg-white/10 hover:bg-primary-light transition-all duration-200 
               hover:shadow-lg hover:shadow-primary-light/20"
  >
    {icon}
    {children}
  </Link>
);

export default Navigation;