import React, { useState } from 'react';
import { Search, Loader2, FileText, CheckCircle, XCircle, Upload, AlertTriangle, Hexagon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { verifyDocumentOnBlockchain, getTransactionHistory } from '../lib/blockchain';
import BlockchainTransactionLog from '../components/BlockchainTransactionLog';

interface Document {
  id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  verified_at: string | null;
  uploaded_by_email: string;
  institution: { name: string };
  comments?: string;
}

export default function PublicPortal() {
  const [loading, setLoading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [error, setError] = useState('');
  const [verificationResult, setVerificationResult] = useState<'authentic' | 'not-authentic' | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);

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

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (!fileInput.files || fileInput.files.length === 0) {
      setError('Please select a file to verify');
      return;
    }

    const file = fileInput.files[0];
    
    setLoading(true);
    setError('');
    setDocument(null);
    setVerificationResult(null);
    setTransactions([]);
    
    try {
      // Calculate hash of uploaded document
      const hash = await calculateFileHash(file);
      console.log('Generated hash:', hash);
      
      try {
        // First check the blockchain record
        const blockchainResult = await verifyDocumentOnBlockchain(hash);
        console.log('Blockchain verification result:', blockchainResult);
        
        // If verified on blockchain, show transactions
        if (blockchainResult.verified && blockchainResult.transactions) {
          setTransactions(blockchainResult.transactions);
        }
      } catch (blockchainError) {
        console.error('Blockchain verification error:', blockchainError);
        // Continue with database verification even if blockchain fails
      }
      
      // Search for document with matching hash in database
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          institution:institutions(name)
        `)
        .eq('hash', hash)
        .single();

      if (error) {
        console.error('Error searching document:', error);
        setVerificationResult('not-authentic');
        setError('No matching document found. This document cannot be verified as authentic.');
        return;
      }

      setDocument(data);
      setVerificationResult('authentic');
      
      // Get full transaction history
      if (data?.id) {
        try {
          const history = await getTransactionHistory(data.id);
          setTransactions(history);
        } catch (historyError) {
          console.error('Error fetching transaction history:', historyError);
          // Continue showing the document even if transaction history fails
        }
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      setError('An error occurred while verifying the document. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const statusIcons = {
    pending: <Loader2 className="h-6 w-6 text-yellow-500" />,
    approved: <CheckCircle className="h-6 w-6 text-green-500" />,
    rejected: <XCircle className="h-6 w-6 text-red-500" />
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Decentralized Document Verification Portal</h1>
        <p className="text-lg text-white/80">Verify the authenticity of your documents</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white mb-2">
                Upload a document to verify its authenticity
              </label>
              <div className="border-2 border-white/20 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  className="hidden"
                  id="file-upload"
                  accept=".pdf"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-white/70" />
                    <p className="mt-2 text-sm text-white">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-white/60">PDF up to 5MB</p>
                  </div>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-dark hover:bg-primary-light transition-colors duration-200 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Verify Document
                </>
              )}
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        )}

        {verificationResult === 'not-authentic' && (
          <div className="mt-4 p-6 bg-red-50 border border-red-200 rounded-lg flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-red-800">Document Not Verified</h3>
              <p className="text-red-700">
                This document could not be verified in our system. It may be modified or not registered.
              </p>
            </div>
          </div>
        )}

        {verificationResult === 'authentic' && !document && (
          <div className="mt-4 p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-4">
            <div className="bg-yellow-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-yellow-800">Verification Processing</h3>
              <p className="text-yellow-700">
                The document was found but details could not be retrieved. Please try again.
              </p>
            </div>
          </div>
        )}

        {document && (
          <div className="mt-8 bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 bg-green-50 border-b border-green-200">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-green-800">Document Verified</h3>
                  <p className="text-green-700">
                    This document has been verified as authentic and matches our records.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">{document.title}</h2>
                {statusIcons[document.status]}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Institution</p>
                  <p className="text-lg font-medium">{document.institution.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 inline-flex text-sm font-semibold rounded-full ${statusColors[document.status]}`}>
                    {document.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Uploaded By</p>
                  <p className="text-lg font-medium">{document.uploaded_by_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Upload Date</p>
                  <p className="text-lg font-medium">
                    {format(new Date(document.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                {document.verified_at && (
                  <div>
                    <p className="text-sm text-gray-500">Verification Date</p>
                    <p className="text-lg font-medium">
                      {format(new Date(document.verified_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </div>
              {document.comments && (
                <div>
                  <p className="text-sm text-gray-500">Comments</p>
                  <p className="mt-1 text-gray-700">{document.comments}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
                className="text-primary-light hover:text-primary-dark transition-colors duration-200 text-sm font-medium flex items-center"
              >
                <Hexagon className="h-4 w-4 mr-1" />
                {showBlockchainDetails ? 'Hide' : 'Show'} Blockchain Details
              </button>
              
              {showBlockchainDetails && (
                <div className="mt-4">
                  <BlockchainTransactionLog transactions={transactions} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}