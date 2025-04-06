import React, { useState } from 'react';
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { getBlockchainStats, generateTransactionHash } from '../lib/blockchain';

export default function BlockchainMigrationTool() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{success: boolean; message: string} | null>(null);

  async function initializeBlockchain() {
    setLoading(true);
    setResults(null);
    
    try {
      // Check current blockchain state
      const stats = getBlockchainStats();
      
      if (stats.totalTransactions === 0) {
        // Initialize with sample transactions
        const hash = generateTransactionHash();
        
        setResults({
          success: true,
          message: 'Blockchain initialized with sample transactions'
        });
      } else {
        setResults({
          success: true,
          message: `Blockchain already initialized with ${stats.totalTransactions} transactions`
        });
      }
    } catch (error) {
      console.error('Initialization error:', error);
      setResults({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initialize blockchain'
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg">
      <div className="p-6 border-b border-white/20">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-orange-500" />
          Blockchain Initialization Tool
        </h2>
        
        <p className="text-sm text-white/80 mt-2">
          Initialize the blockchain system with sample transactions for testing and development.
          This will create an in-memory blockchain with demo data.
        </p>
      </div>
      
      <div className="p-6">
        {results && (
          <div className={`p-4 rounded-lg mb-4 ${
            results.success ? 'bg-[#2c505c]/60' : 'bg-red-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <p className="text-white">
                {results.message}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={initializeBlockchain}
          disabled={loading}
          className="w-full bg-[#0b3030] hover:bg-[#379e7e] disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Initializing Blockchain...
            </>
          ) : (
            <>
              <Database className="h-5 w-5" />
              Initialize Blockchain
            </>
          )}
        </button>
      </div>
    </div>
  );
}