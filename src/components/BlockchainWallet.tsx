import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CircuitBoard, 
  Network, 
  Clock, 
  Shield, 
  Activity,
  Hexagon,
  Users,
  Box,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { getTransactionHistory, BlockchainTransaction } from '../lib/blockchain';

interface NetworkStats {
  nodes: number;
  activeNodes: number;
  lastBlockTime: Date;
  networkHealth: 'healthy' | 'degraded' | 'issues';
  averageBlockTime: number;
  totalTransactions: number;
}

export default function BlockchainWallet() {
  const [transactions, setTransactions] = useState<BlockchainTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    nodes: 0,
    activeNodes: 0,
    lastBlockTime: new Date(),
    networkHealth: 'healthy',
    averageBlockTime: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    fetchWalletData();
    const interval = setInterval(fetchWalletData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchWalletData() {
    try {
      setLoading(true);
      // Fetch blockchain transactions
      const txHistory = await getTransactionHistory();
      setTransactions(txHistory);

      // Simulate network statistics
      setNetworkStats({
        nodes: Math.floor(Math.random() * 20) + 80, // 80-100 nodes
        activeNodes: Math.floor(Math.random() * 10) + 70, // 70-80 active nodes
        lastBlockTime: new Date(),
        networkHealth: Math.random() > 0.9 ? 'degraded' : 'healthy',
        averageBlockTime: Math.floor(Math.random() * 2) + 3, // 3-5 seconds
        totalTransactions: txHistory.length
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  }

  const healthColors = {
    healthy: 'text-green-500',
    degraded: 'text-yellow-500',
    issues: 'text-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Network Status Card */}
      <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Network className="h-6 w-6 text-orange-500" />
            Network Status
          </h2>
        </div>
        <div className="p-6 border-b border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <CircuitBoard className={`h-8 w-8 ${healthColors[networkStats.networkHealth]}`} />
              <div>
                <p className="text-sm text-white">Active Nodes</p>
                <p className="text-2xl font-bold text-white">{networkStats.activeNodes}/{networkStats.nodes}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-white/70">Avg Block Time</p>
                <p className="text-2xl font-bold text-white">{networkStats.averageBlockTime}s</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-white/70">Total Transactions</p>
                <p className="text-2xl font-bold text-white">{networkStats.totalTransactions}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={fetchWalletData} 
              className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Network className="h-5 w-5" />
              Refresh Network
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg">
        <div className="p-6 border-b border-white/20">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-orange-500" />
            Recent Transactions
          </h2>
        </div>
        <div className="p-6 border-b border-white/20">
          {loading ? (
            <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg p-4">
              <Clock className="h-8 w-8 animate-spin mx-auto text-orange-500" />
              <p className="mt-2 text-white text-center">Fetching transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg p-4">
              <Box className="h-8 w-8 mx-auto text-white" />
              <p className="mt-2 text-white text-center">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {tx.action === 'upload' ? (
                        <ArrowUpRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium text-white">{tx.document_title}</p>
                        <p className="text-sm text-white">
                          {format(new Date(tx.timestamp), 'MMM d, yyyy HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-white">{tx.transaction_hash.substring(0, 16)}...</p>
                      <p className="text-sm text-white">{tx.actor_email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end space-x-4">
            <button 
              className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Hexagon className="h-5 w-5" />
              View All
            </button>
            <button 
              onClick={fetchWalletData}
              className="bg-[#0b3030] hover:bg-[#379e7e] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <Clock className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-orange-500" />
              Security Status
            </h2>
          </div>
          <div className="p-6 border-b border-white/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white">Network Security</span>
                <span className="text-white font-medium">Strong</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Last Block Hash</span>
                <span className="font-mono text-sm text-white">0x8f2a...4e91</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Consensus</span>
                <span className="text-green-500 font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#2c505c]/40 backdrop-blur-sm rounded-lg shadow-lg">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="h-6 w-6 text-orange-500" />
              Network Participants
            </h2>
          </div>
          <div className="p-6 border-b border-white/20">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white">Verifiers</span>
                <span className="text-white font-medium">{Math.floor(Math.random() * 10) + 20}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Institutions</span>
                <span className="text-white font-medium">{Math.floor(Math.random() * 5) + 10}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Active Users</span>
                <span className="text-white font-medium">{Math.floor(Math.random() * 50) + 100}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}