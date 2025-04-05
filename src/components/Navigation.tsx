import React from 'react';
import { Link } from 'react-router-dom';
import { FileCheck, Users, Building2, Search } from 'lucide-react';

const Navigation = () => {
  return (
    <nav className="bg-orange-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <FileCheck className="h-8 w-8" />
            <span className="text-xl font-bold">DocCrypts</span>
          </Link>
          
          <div className="flex space-x-4">
            <Link to="/user" className="flex items-center space-x-1 hover:text-orange-200">
              <Users className="h-5 w-5" />
              <span>User</span>
            </Link>
            <Link to="/verifier" className="flex items-center space-x-1 hover:text-orange-200">
              <FileCheck className="h-5 w-5" />
              <span>Verifier</span>
            </Link>
            <Link to="/admin" className="flex items-center space-x-1 hover:text-orange-200">
              <Building2 className="h-5 w-5" />
              <span>Admin</span>
            </Link>
            <Link to="/" className="flex items-center space-x-1 hover:text-orange-200">
              <Search className="h-5 w-5" />
              <span>Verify</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;