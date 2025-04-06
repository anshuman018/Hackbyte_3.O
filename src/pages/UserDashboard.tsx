import React, { useState, useEffect } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { recordDocumentTransaction } from '../lib/blockchain';

interface Document {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  file_path: string;
  comments?: string;
  institution: { name: string };
  institution_id: string;
}

export default function UserDashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    fetchInstitutions();
  }, []);

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          institution:institutions(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched documents:', data); // Debug log
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Error fetching documents');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInstitutions() {
    try {
      const { data, error } = await supabase
        .from('institutions')
        .select('*');

      if (error) throw error;
      setInstitutions(data || []);
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setError('Error fetching institutions');
    }
  }

  async function calculateFileHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setError(null);

    const formData = new FormData(event.target);
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const institutionId = formData.get('institution') as string;
    const email = formData.get('email') as string;

    console.log('Upload attempt:', {
      title,
      institutionId,
      email,
      fileName: file.name
    });

    if (!institutionId) {
      alert('Please select an institution');
      setUploading(false);
      return;
    }

    try {
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('File size must be less than 5MB');
      }

      const hash = await calculateFileHash(file);
      console.log('Generated hash:', hash);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      console.log('Attempting to upload file:', { fileName, fileSize: file.size, fileType: file.type });

      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (fileError) {
        console.error('Storage upload error:', fileError);
        throw fileError;
      }

      if (!fileData?.path) {
        throw new Error('File upload failed - no path returned');
      }

      console.log('File uploaded successfully:', fileData);

      const { data: docData, error: dbError } = await supabase
        .from('documents')
        .insert({
          title,
          institution_id: institutionId,
          uploaded_by_email: email,
          status: 'pending',
          file_path: fileName,
          hash: hash
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Document created:', docData);

      // Record the transaction in our blockchain
      await recordDocumentTransaction(
        docData.id,
        hash,
        title,
        'upload',
        email
      );

      fetchDocuments();
      event.target.reset();
      alert('Document uploaded successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">My Documents</h1>
      </div>

      {error && (
        <div className="p-4 mb-4 text-white bg-red-500/80 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6 text-white">
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Document Title</label>
            <input
              type="text"
              name="title"
              required
              className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Institution</label>
            <select
              name="institution"
              required
              className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50"
            >
              <option value="" className="bg-[#2c505c] text-white">Select Institution</option>
              {institutions.map(inst => (
                <option 
                  key={inst.id} 
                  value={inst.id} 
                  className="bg-[#2c505c] text-white"
                >
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white">Document (PDF)</label>
            <input
              type="file"
              name="file"
              accept=".pdf"
              required
              className="w-full p-2 border rounded mt-1 bg-[#2c505c]/40 text-white placeholder-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#2c505c]/40 file:text-white hover:file:bg-[#379e7e] transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <FileText size={20} />
            )}
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow overflow-hidden text-white">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white">Uploaded Documents</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No documents uploaded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-[#2c505c]/40">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Comments</th>
                </tr>
              </thead>
              <tbody className="bg-[#2c505c]/40 divide-y divide-white/20">
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{doc.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[doc.status]}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {doc.comments || '-'}
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