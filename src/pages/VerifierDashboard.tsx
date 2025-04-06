import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, Eye, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Institution {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  uploaded_by_email: string;
  file_path: string;
  hash?: string;
  institution_id: string;
  institution: Institution | Institution[] | null;
}

export default function VerifierDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifierEmail, setVerifierEmail] = useState('');
  const [verifierId, setVerifierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any>(null); // Add debug state
  const [updatingId, setUpdatingId] = useState<string | null>(null); // Add updatingId state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('verifierEmail');
    if (email) {
      setVerifierEmail(email);
      fetchVerifierId(email);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchVerifierId(email: string) {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Fetching verifier for email:', email); // Debug log
      
      const { data, error } = await supabase
        .from('verifiers')
        .select('id, institution_id')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error); // Debug log
        throw error;
      }
      
      console.log('Fetched verifier data:', data); // Debug log

      if (!data) {
        setError('No verifier account found with this email address. Please contact your administrator.');
        localStorage.removeItem('verifierEmail');
        setVerifierEmail('');
        return;
      }

      setVerifierId(data.id);
      fetchDocuments(data.institution_id);
    } catch (error) {
      console.error('Error fetching verifier:', error);
      setError('An error occurred while fetching verifier information. Please try again.');
      localStorage.removeItem('verifierEmail');
      setVerifierEmail('');
    } finally {
      setLoading(false);
    }
  }

  async function fetchDocuments(institutionId: string) {
    try {
      console.log('Fetching documents for institution:', institutionId);
      
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          status,
          created_at,
          uploaded_by_email,
          file_path,
          hash,
          institution_id,
          institution:institutions(id, name)
        `)
        .eq('institution_id', institutionId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Institution documents:', data);
      
      // Fix institution processing to handle both array and direct object formats
      const formattedDocuments = (data || []).map(doc => {
        let institutionName = 'Unknown Institution';
        let institutionId = doc.institution_id;
        
        if (doc.institution) {
          if (Array.isArray(doc.institution)) {
            institutionName = doc.institution[0]?.name || 'Unknown Institution';
            institutionId = doc.institution[0]?.id || doc.institution_id;
          } else if (typeof doc.institution === 'object') {
            institutionName = (doc.institution as any).name || 'Unknown Institution';
            institutionId = (doc.institution as any).id || doc.institution_id;
          }
        }
        
        return {
          ...doc,
          institution: {
            id: institutionId,
            name: institutionName
          }
        };
      });
      
      setDocuments(formattedDocuments as Document[]);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('An error occurred while fetching documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(documentId: string, status: 'approved' | 'rejected', comments?: string) {
    try {
      setUpdatingId(documentId);
      
      // Update document status in database
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          status,
          comments,
          verified_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? {...doc, status, comments, verified_at: new Date().toISOString()}
            : doc
        )
      );

      setToast({ message: `Document ${status} successfully`, type: 'success' });
    } catch (error) {
      console.error('Error updating document:', error);
      setToast({ message: 'Failed to update document status', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  }

  async function viewDocument(filePath: string) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);
      
      if (error) throw error;
      
      // Create blob URL and open in new tab
      const url = URL.createObjectURL(data);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      alert('Error loading document');
    }
  }

  // Add this function to download documents
  async function downloadDocument(filePath: string, title: string) {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);
      
      if (error) {
        throw error;
      }

      // Create a download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.pdf`; // Use document title for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document. Please try again.');
    }
  }

  if (!verifierEmail) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Verifier Login</h1>
        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <form onSubmit={(e) => {
            e.preventDefault();
            const email = (e.target as HTMLFormElement).email.value;
            localStorage.setItem('verifierEmail', email);
            setVerifierEmail(email);
            fetchVerifierId(email);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white">Email</label>
              <input
                type="email"
                name="email"
                required
                className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Document Verification</h1>
        <button
          onClick={() => {
            localStorage.removeItem('verifierEmail');
            setVerifierEmail('');
            setVerifierId(null);
            setError(null);
          }}
          className="text-gray-300 hover:text-white transition-colors duration-200"
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {debug && (
        <div className="p-4 bg-[#2c505c]/40 rounded-lg text-sm font-mono text-white">
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}

      <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <Loader2 className="animate-spin mx-auto text-white" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-gray-300">
            No pending documents to verify
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#1c3038]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{doc.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {doc.uploaded_by_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => downloadDocument(doc.file_path, doc.title)}
                        className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-3 py-1 rounded flex items-center gap-1 transition-colors duration-200"
                      >
                        <FileText className="h-5 w-5" />
                        Download
                      </button>
                      <button
                        onClick={() => viewDocument(doc.file_path)}
                        className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-3 py-1 rounded transition-colors duration-200"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={async () => {
                          setUpdatingId(doc.id);
                          const comments = prompt('Add comments (optional):');
                          await handleVerification(doc.id, 'approved', comments || undefined);
                          setUpdatingId(null);
                        }}
                        disabled={updatingId === doc.id}
                        className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-3 py-1 rounded disabled:opacity-50 transition-colors duration-200"
                      >
                        {updatingId === doc.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={async () => {
                          setUpdatingId(doc.id);
                          const comments = prompt('Add rejection reason:');
                          if (comments) {
                            await handleVerification(doc.id, 'rejected', comments);
                          }
                          setUpdatingId(null);
                        }}
                        disabled={updatingId === doc.id}
                        className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-3 py-1 rounded disabled:opacity-50 transition-colors duration-200"
                      >
                        {updatingId === doc.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}