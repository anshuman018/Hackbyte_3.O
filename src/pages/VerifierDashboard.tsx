import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, AlertCircle, Eye, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  uploaded_by_email: string;
  file_path: string;
  institution: { name: string };
  institution_id: string; // Add this field
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
      
      // First, check all documents in the system
      const { data: allDocs, error: countError } = await supabase
        .from('documents')
        .select('*');
      
      console.log('All documents in system:', allDocs);

      // Then fetch documents for this institution
      const { data, error } = await supabase
        .from('documents')
        .select(`
          id,
          title,
          status,
          created_at,
          uploaded_by_email,
          file_path,
          institution_id,
          institution:institutions (
            id,
            name
          )
        `)
        .eq('institution_id', institutionId);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Institution documents:', data);
      
      // Transform the data to match the Document interface
      const formattedDocuments = (data || []).map(doc => ({
        ...doc,
        institution: { 
          name: doc.institution?.[0]?.name || 'Unknown Institution' 
        }
      }));
      
      setDocuments(formattedDocuments);

      // Set debug info
      setDebug({
        allDocuments: allDocs,
        institutionDocuments: data,
        institutionId,
        verifierId: verifierId
      });

    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('An error occurred while fetching documents. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(documentId: string, status: 'approved' | 'rejected', comments?: string) {
    try {
      console.log('Updating document:', { documentId, status, comments }); // Debug log

      const { data, error } = await supabase
        .from('documents')
        .update({ 
          status: status,
          comments: comments,
          verified_at: new Date().toISOString(),
          verifier_id: verifierId
        })
        .eq('id', documentId)
        .select();

      if (error) {
        console.error('Error updating document:', error);
        throw error;
      }

      console.log('Document updated:', data); // Debug log

      // Refresh documents list
      if (verifierId) {
        fetchDocuments(data[0].institution_id);
      }

      setToast({ message: `Document ${status} successfully`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error updating document:', error);
      setToast({ message: 'Failed to update document status. Please try again.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
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
        <h1 className="text-3xl font-bold text-gray-900">Verifier Login</h1>
        <div className="bg-white rounded-lg shadow p-6">
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
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg"
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
        <h1 className="text-3xl font-bold text-gray-900">Document Verification</h1>
        <button
          onClick={() => {
            localStorage.removeItem('verifierEmail');
            setVerifierEmail('');
            setVerifierId(null);
            setError(null);
          }}
          className="text-gray-600 hover:text-gray-900"
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
        <div className="p-4 bg-gray-50 rounded-lg text-sm font-mono">
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No pending documents to verify
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doc.uploaded_by_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => downloadDocument(doc.file_path, doc.title)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <FileText className="h-5 w-5" />
                        Download
                      </button>
                      <button
                        onClick={() => viewDocument(doc.file_path)}
                        className="text-blue-600 hover:text-blue-900"
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
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
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
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
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