import { SHA256 } from 'crypto-js';

export interface BlockchainTransaction {
  id: string;
  document_hash: string;
  document_id: string;
  transaction_hash: string;
  document_title: string;
  action: 'upload' | 'verify' | 'approve' | 'reject';
  actor_email: string;
  timestamp: string;
  status: 'confirmed' | 'pending';
  metadata?: Record<string, any>;
}

// Expanded dummy data with more realistic examples
const SAMPLE_DOCUMENTS = [
  {
    id: 'DOC001',
    title: 'University Degree Certificate',
    hash: SHA256('University_Degree_2023').toString(),
    institution: 'Harvard University'
  },
  {
    id: 'DOC002',
    title: 'Professional Certification',
    hash: SHA256('Professional_Cert_2023').toString(),
    institution: 'Microsoft'
  }
];

// Generate 20 sample transactions
export function generateSampleTransactions(): BlockchainTransaction[] {
  const transactions: BlockchainTransaction[] = [];
  const actions: Array<'upload' | 'verify' | 'approve' | 'reject'> = ['upload', 'verify', 'approve', 'reject'];
  const emails = ['admin@edu.com', 'verifier@org.com', 'user@example.com'];

  SAMPLE_DOCUMENTS.forEach(doc => {
    // Generate 5 transactions per document
    for (let i = 0; i < 5; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const email = emails[Math.floor(Math.random() * emails.length)];
      
      transactions.push({
        id: `TX${Math.random().toString(36).substring(2, 15)}`,
        document_hash: doc.hash,
        document_id: doc.id,
        transaction_hash: '0x' + SHA256(Date.now() + Math.random().toString()).toString(),
        document_title: doc.title,
        action: action,
        actor_email: email,
        timestamp: new Date(Date.now() - i * 86400000).toISOString(), // Spread over last few days
        status: 'confirmed',
        metadata: {
          institution: doc.institution,
          verificationMethod: 'SHA-256',
          networkNode: `node_${Math.floor(Math.random() * 5) + 1}`
        }
      });
    }
  });

  return transactions.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Initialize with sample data
const blockchainTransactions: BlockchainTransaction[] = generateSampleTransactions();

// Improved transaction hash generation
export function generateTransactionHash(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString();
  const data = `${timestamp}-${random}-${blockchainTransactions.length}`;
  return '0x' + SHA256(data).toString();
}

// Record a new transaction
export async function recordDocumentTransaction(
  documentId: string,
  documentHash: string,
  documentTitle: string,
  action: 'upload' | 'verify' | 'approve' | 'reject',
  email: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const transaction: BlockchainTransaction = {
      id: Math.random().toString(36).substring(7),
      document_hash: documentHash,
      document_id: documentId,
      transaction_hash: generateTransactionHash(),
      document_title: documentTitle,
      action,
      actor_email: email,
      timestamp: new Date().toISOString(),
      status: 'confirmed',
      metadata
    };

    blockchainTransactions.unshift(transaction);
    return true;
  } catch (error) {
    console.error('Transaction recording failed:', error);
    return false;
  }
}

// Get transaction history
export async function getTransactionHistory(documentId?: string): Promise<BlockchainTransaction[]> {
  if (documentId) {
    return blockchainTransactions.filter(tx => tx.document_id === documentId);
  }
  return blockchainTransactions;
}

// Verify document on blockchain
export async function verifyDocumentOnBlockchain(documentHash: string): Promise<{
  verified: boolean;
  transactions?: BlockchainTransaction[];
  error?: string;
}> {
  try {
    const transactions = blockchainTransactions.filter(
      tx => tx.document_hash === documentHash
    );

    return {
      verified: transactions.length > 0,
      transactions: transactions,
      error: transactions.length === 0 ? 
        'No blockchain records found for this document' : undefined
    };
  } catch (error) {
    return {
      verified: false,
      error: 'Verification failed'
    };
  }
}

// Calculate document hash
export async function calculateDocumentHash(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result;
        const hash = SHA256(content as string).toString();
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// Get blockchain statistics
export function getBlockchainStats() {
  return {
    totalTransactions: blockchainTransactions.length,
    uniqueDocuments: new Set(blockchainTransactions.map(tx => tx.document_id)).size,
    latestBlock: blockchainTransactions[0],
    nodeStatus: 'healthy',
    lastUpdate: new Date().toISOString()
  };
}

// Search transactions
export function searchTransactions(query: string): BlockchainTransaction[] {
  const lowerQuery = query.toLowerCase();
  return blockchainTransactions.filter(tx => 
    tx.document_title.toLowerCase().includes(lowerQuery) ||
    tx.document_id.toLowerCase().includes(lowerQuery) ||
    tx.actor_email.toLowerCase().includes(lowerQuery)
  );
}

// Get transaction by hash
export function getTransactionByHash(hash: string): BlockchainTransaction | null {
  return blockchainTransactions.find(tx => tx.transaction_hash === hash) || null;
}

