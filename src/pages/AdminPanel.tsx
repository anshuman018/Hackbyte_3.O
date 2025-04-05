import React, { useState, useEffect } from 'react';
import { FileText, Building2, Users, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import BlockchainDebug from '../components/BlockchainDebug';
import BlockchainMigrationTool from '../components/BlockchainMigrationTool';
import BlockchainTransactionLog from '../components/BlockchainTransactionLog';
import BlockchainWallet from '../components/BlockchainWallet';
import { getTransactionHistory, BlockchainTransaction } from '../lib/blockchain';

// Hardcoded admin credentials - in a real app, this would be more secure
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

interface Institution {
  id: string;
  name: string;
  created_at: string;
}

interface Verifier {
  id: string;
  email: string;
  institution: Institution;
}

interface Stats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}

export default function AdminPanel() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [newInstitution, setNewInstitution] = useState('');
  const [newVerifier, setNewVerifier] = useState({ email: '', institutionId: '' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [blockchainTransactions, setBlockchainTransactions] = useState<BlockchainTransaction[]>([]);

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuthenticated') === 'true';
    setIsAuthenticated(isAuth);

    if (isAuth) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  async function fetchData() {
    try {
      // Fetch institutions
      const { data: institutionsData, error: institutionsError } = await supabase
        .from('institutions')
        .select('*')
        .order('name');

      if (institutionsError) throw institutionsError;
      setInstitutions(institutionsData || []);

      // Fetch verifiers with their institutions
      const { data: verifiersData, error: verifiersError } = await supabase
        .from('verifiers')
        .select(`
          *,
          institution:institutions(*)
        `)
        .order('email');

      if (verifiersError) throw verifiersError;

      // Process verifier data to handle potential array format
      const processedVerifiers = verifiersData?.map(verifier => ({
        ...verifier,
        institution: Array.isArray(verifier.institution) 
          ? verifier.institution[0] 
          : verifier.institution
      })) || [];
      
      setVerifiers(processedVerifiers);

      // Fetch document stats - handle the enum type correctly
      const { data: statsData, error: statsError } = await supabase
        .from('documents')
        .select('status');

      if (statsError) throw statsError;

      const stats = (statsData || []).reduce((acc: Stats, doc) => {
        acc.total++;
        // Handle document status as string regardless of underlying type
        const status = String(doc.status).toLowerCase() as keyof Pick<Stats, 'approved' | 'rejected' | 'pending'>;
        if (status === 'approved' || status === 'rejected' || status === 'pending') {
          acc[status]++;
        }
        return acc;
      }, { total: 0, approved: 0, rejected: 0, pending: 0 });

      setStats(stats);

      // Fetch blockchain data
      fetchBlockchainData();
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBlockchainData() {
    try {
      const transactions = await getTransactionHistory();
      setBlockchainTransactions(transactions);
    } catch (error) {
      console.error('Error fetching blockchain data:', error);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    // Clear any previous errors
    setAuthError('');

    // Simple credential validation
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuthenticated', 'true');
      fetchData(); // Fetch admin data once authenticated
    } else {
      setAuthError('Invalid email or password');
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuthenticated');
  }

  async function handleAddInstitution(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('institutions')
        .insert({ name: newInstitution });

      if (error) throw error;
      setNewInstitution('');
      fetchData();
    } catch (error) {
      console.error('Error adding institution:', error);
    }
  }

  async function handleAddVerifier(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('verifiers')
        .insert({
          email: newVerifier.email,
          institution_id: newVerifier.institutionId
        });

      if (error) throw error;
      setNewVerifier({ email: '', institutionId: '' });
      fetchData();
    } catch (error) {
      console.error('Error adding verifier:', error);
    }
  }

  async function handleDeleteInstitution(id: string) {
    if (!confirm('Are you sure? This will delete all associated verifiers and documents.')) return;
    try {
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting institution:', error);
    }
  }

  async function handleDeleteVerifier(id: string) {
    if (!confirm('Are you sure you want to delete this verifier?')) return;
    try {
      const { error } = await supabase
        .from('verifiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting verifier:', error);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4 text-white">Admin Login</h1>
        {authError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{authError}</p>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50"
              placeholder="Admin Email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50"
              placeholder="Password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#0b3030] hover:bg-[#379e7e] text-white p-2 rounded transition-colors duration-200"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg transition-colors duration-200"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Total Documents</h2>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Approved</h2>
          </div>
          <p className="text-3xl font-bold text-white">{stats.approved}</p>
        </div>

        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Rejected</h2>
          </div>
          <p className="text-3xl font-bold text-white">{stats.rejected}</p>
        </div>

        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Pending</h2>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Institutions</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddInstitution} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
                placeholder="Institution name"
                className="flex-1 rounded-md border-white/20 bg-[#2c505c]/40 text-white placeholder-white/50"
              />
              <button
                type="submit"
                className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                Add
              </button>
            </form>
            <div className="space-y-2">
              {institutions.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between p-3 bg-[#2c505c]/40 rounded-lg">
                  <span className="text-white">{inst.name}</span>
                  <button
                    onClick={() => handleDeleteInstitution(inst.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white">Verifiers</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddVerifier} className="space-y-4 mb-4">
              <input
                type="email"
                value={newVerifier.email}
                onChange={(e) => setNewVerifier({ ...newVerifier, email: e.target.value })}
                placeholder="Verifier email"
                className="w-full rounded-md border-white/20 bg-[#2c505c]/40 text-white placeholder-white/50"
              />
              <select
                value={newVerifier.institutionId}
                onChange={(e) => setNewVerifier({ ...newVerifier, institutionId: e.target.value })}
                className="w-full rounded-md border-white/20 bg-[#2c505c]/40 text-white placeholder-white/50"
              >
                <option value="">Select Institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
              >
                <Plus className="h-5 w-5" />
                Add Verifier
              </button>
            </form>
            <div className="space-y-2">
              {verifiers.map((verifier) => (
                <div key={verifier.id} className="flex items-center justify-between p-3 bg-[#2c505c]/40 rounded-lg">
                  <div>
                    <div className="text-white">{verifier.email}</div>
                    <div className="text-sm text-white/70">{verifier.institution?.name}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteVerifier(verifier.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <h2 className="text-2xl font-semibold text-white">Blockchain Management</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <BlockchainDebug />
            <BlockchainMigrationTool />
          </div>
          
          <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">Recent Blockchain Activity</h2>
            </div>
            <div className="p-6">
              <BlockchainTransactionLog 
                transactions={blockchainTransactions.slice(0, 5)} 
                loading={loading}
              />
              
              {blockchainTransactions.length > 0 && (
                <div className="mt-4 text-center">
                  <span className="text-sm text-white/70">
                    Showing 5 of {blockchainTransactions.length} transactions
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mt-6">
        <h2 className="text-2xl font-semibold text-white">Blockchain Wallet</h2>
        <BlockchainWallet />
      </div>
    </div>
  );
}