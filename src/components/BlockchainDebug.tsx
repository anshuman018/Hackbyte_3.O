import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { checkDatabaseHealth } from '../lib/databaseCheck';

export default function BlockchainDebug() {
  interface DatabaseStatus {
    ok: boolean;
    tables: Record<string, boolean>;
    errors: string[];
  }
  
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const result = await checkDatabaseHealth();
        setStatus(result);
      } catch (error) {
        console.error('Failed to check database status:', error);
        setStatus({ ok: false, tables: {}, errors: ['Failed to check database status'] });
      } finally {
        setLoading(false);
      }
    }
    
    checkStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow flex items-center gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
        <span>Checking blockchain status...</span>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg shadow ${status.ok ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {status.ok ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-red-600" />
        )}
        <h3 className={`font-medium ${status.ok ? 'text-green-800' : 'text-red-800'}`}>
          Blockchain System Status: {status.ok ? 'Healthy' : 'Issues Detected'}
        </h3>
      </div>
      
      <div className="mt-2">
        <h4 className="text-sm font-medium mb-1">Database Tables:</h4>
        <ul className="text-sm space-y-1">
          {Object.entries(status.tables).map(([table, available]: [string, boolean]) => (
            <li key={table} className="flex items-center gap-1">
              {available ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <span className={available ? 'text-green-700' : 'text-red-700'}>
                {table}: {available ? 'Available' : 'Unavailable'}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      {status.errors.length > 0 && (
        <div className="mt-2">
          <h4 className="text-sm font-medium mb-1 text-red-800">Errors:</h4>
          <ul className="text-xs space-y-1 text-red-700">
            {status.errors.map((error: string, index: number) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}