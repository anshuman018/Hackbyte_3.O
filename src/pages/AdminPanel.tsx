import React, { useState, useEffect } from 'react';
import { FileText, Building2, Users, Loader2, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'admin@example.com'; // Replace with your admin email

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
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

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
      setVerifiers(verifiersData || []);

      // Fetch document stats
      const { data: statsData, error: statsError } = await supabase
        .from('documents')
        .select('status');

      if (statsError) throw statsError;

      const stats = (statsData || []).reduce((acc: Stats, doc) => {
        acc.total++;
        const status = doc.status as keyof Pick<Stats, 'approved' | 'rejected' | 'pending'>;
        if (status === 'approved' || status === 'rejected' || status === 'pending') {
          acc[status]++;
        }
        return acc;
      }, { total: 0, approved: 0, rejected: 0, pending: 0 });

      setStats(stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const email = (e.target as HTMLFormElement).email.value;
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    if (error) {
      alert(error.message);
    } else {
      alert('Check your email for the login link!');
    }
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

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            className="w-full p-2 border rounded"
          />
          <button
            type="submit"
            className="w-full bg-orange-600 text-white p-2 rounded"
          >
            Send Magic Link
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
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">Total Documents</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">Approved</h2>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-800">Rejected</h2>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-800">Pending</h2>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Institutions</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddInstitution} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newInstitution}
                onChange={(e) => setNewInstitution(e.target.value)}
                placeholder="Institution name"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
              <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add
              </button>
            </form>
            <div className="space-y-2">
              {institutions.map((inst) => (
                <div key={inst.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span>{inst.name}</span>
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

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Verifiers</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddVerifier} className="space-y-4 mb-4">
              <input
                type="email"
                value={newVerifier.email}
                onChange={(e) => setNewVerifier({ ...newVerifier, email: e.target.value })}
                placeholder="Verifier email"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
              <select
                value={newVerifier.institutionId}
                onChange={(e) => setNewVerifier({ ...newVerifier, institutionId: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              >
                <option value="">Select Institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Verifier
              </button>
            </form>
            <div className="space-y-2">
              {verifiers.map((verifier) => (
                <div key={verifier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div>{verifier.email}</div>
                    <div className="text-sm text-gray-500">{verifier.institution?.name}</div>
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
    </div>
  );
}