import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import UserDashboard from './pages/UserDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import PublicPortal from './pages/PublicPortal';
import AdminPanel from './pages/AdminPanel';
import Navigation from './components/Navigation';
import SplineBackground from './components/SplineBackground';

function App() {
  return (
    <Router>
      <div className="relative min-h-screen bg-[#0b3030]">
        {/* Spline Background */}
        <SplineBackground />
        
        {/* Content Layer */}
        <div className="relative z-10">
          <Navigation />
          <main className="container mx-auto px-6 pt-24 pb-12 min-h-screen">
            <Routes>
              <Route path="/" element={<PublicPortal />} />
              <Route path="/user" element={<UserDashboard />} />
              <Route path="/verifier" element={<VerifierDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;