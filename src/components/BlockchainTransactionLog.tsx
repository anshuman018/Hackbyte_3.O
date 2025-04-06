import React from 'react';
import { Hexagon, CheckCircle, Clock, FileCheck } from 'lucide-react';
import { format } from 'date-fns';
import { BlockchainTransaction } from '../lib/blockchain';

interface Props {
  transactions: BlockchainTransaction[];
  loading?: boolean;
}

export default function BlockchainTransactionLog({ transactions, loading = false }: Props) {
  return (
    <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-[#2c505c]/40 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center">
          <Hexagon className="h-6 w-6 text-white mr-2" />
          <h2 className="text-lg font-semibold text-white">DocCrypts Blockchain Ledger</h2>
        </div>
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <Clock className="h-6 w-6 animate-pulse mx-auto text-white" />
            <p className="text-white mt-2 text-center">Loading transaction history...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg p-4">
            <p className="text-white text-center">No blockchain transactions recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-[#2c505c]/40">
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Transaction Hash</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Document</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Action</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">By</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Timestamp</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[#2c505c]/60">
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs text-white truncate max-w-[150px]">
                        {tx.transaction_hash}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center">
                        <FileCheck className="h-4 w-4 text-white mr-2" />
                        <span className="text-sm text-white">{tx.document_title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${tx.action === 'upload' ? 'bg-blue-100 text-blue-800' : ''}
                        ${tx.action === 'verify' ? 'bg-indigo-100 text-indigo-800' : ''}
                        ${tx.action === 'approve' ? 'bg-green-100 text-green-800' : ''}
                        ${tx.action === 'reject' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {tx.action}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-white">
                      {tx.actor_email}
                    </td>
                    <td className="px-3 py-2 text-sm text-white">
                      {format(new Date(tx.timestamp), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-3 py-2">
                      {tx.status === 'confirmed' ? (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-xs">Confirmed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-yellow-600">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-xs">Pending</span>
                        </span>
                      )}
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