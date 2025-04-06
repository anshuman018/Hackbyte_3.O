import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-my-custom-header': 'blockchain-service'
    }
  }
});

// Enhanced health check function
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  tableAccessible: boolean;
  error?: string;
}> {
  try {
    // First check basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('documents')
      .select('count')
      .limit(1);

    if (connectionError) {
      return {
        connected: false,
        tableAccessible: false,
        error: `Connection error: ${connectionError.message}`
      };
    }

    // Then check blockchain table specifically
    const { error: blockchainError } = await supabase
      .from('blockchain_transactions')
      .select('id')
      .limit(1);

    return {
      connected: true,
      tableAccessible: !blockchainError,
      error: blockchainError ? blockchainError.message : undefined
    };
  } catch (error) {
    return {
      connected: false,
      tableAccessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}