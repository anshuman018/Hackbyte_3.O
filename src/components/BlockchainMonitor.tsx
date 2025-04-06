import React, { useState, useEffect } from 'react';
import { getBlockchainStats, getTransactionHistory } from '../lib/blockchain';

export function BlockchainMonitor() {
  const [stats, setStats] = useState<any>({});
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const blockchainStats = await getBlockchainStats();
      const transactions = await getTransactionHistory();
      setStats(blockchainStats);
      setRecentTransactions(transactions.slice(0, 5));
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Blockchain Status</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-green-50 rounded">
          <div className="text-sm text-gray-600">Total Transactions</div>
          <div className="text-2xl font-bold">{stats.totalTransactions}</div>
        </div>
        <div className="p-3 bg-blue-50 rounded">
          <div className="text-sm text-gray-600">Unique Documents</div>
          <div className="text-2xl font-bold">{stats.uniqueDocuments}</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Recent Transactions</h3>
        <div className="space-y-2">
          {recentTransactions.map(tx => (
            <div key={tx.id} className="p-2 bg-gray-50 rounded text-sm">
              <div className="font-medium">{tx.document_title}</div>
              <div className="text-gray-500">
                {new Date(tx.timestamp).toLocaleString()} - {tx.action}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}