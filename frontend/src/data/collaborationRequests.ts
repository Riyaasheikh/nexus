import type { CollaborationRequest } from '../types'; // [cite: 1]

// Mock data strictly following the Nexus interface 
export const collaborationRequests: CollaborationRequest[] = [
  {
    id: 'req1',
    investorId: 'i1',
    entrepreneurId: 'e1',
    message: 'Id like to explore potential investment in TechWave AI.',
    status: 'pending',
    createdAt: '2023-08-10T15:30:00Z'
  },
  {
    id: 'req2',
    investorId: 'i2',
    entrepreneurId: 'e1',
    message: 'Interested in discussing sustainable practices.',
    status: 'accepted',
    createdAt: '2023-08-05T11:45:00Z'
  }
];

// Helper to get requests for an entrepreneur dashboard [cite: 21]
export const getRequestsForEntrepreneur = (entrepreneurId: string): CollaborationRequest[] => {
  return [...collaborationRequests] // Create a shallow copy for sorting
    .filter(request => request.entrepreneurId === entrepreneurId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Helper to get requests sent by an investor [cite: 21]
export const getRequestsFromInvestor = (investorId: string): CollaborationRequest[] => {
  return [...collaborationRequests]
    .filter(request => request.investorId === investorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Helper to update status (Milestone 3: accepting/rejecting meetings) [cite: 32]
export const updateRequestStatus = (
  requestId: string, 
  newStatus: 'pending' | 'accepted' | 'rejected'
): CollaborationRequest | null => {
  const index = collaborationRequests.findIndex(req => req.id === requestId);
  if (index === -1) return null;
  
  // Immutably update the status [cite: 32]
  collaborationRequests[index] = {
    ...collaborationRequests[index],
    status: newStatus
  };
  
  return collaborationRequests[index];
};

// Create a new request 
export const createCollaborationRequest = (
  investorId: string,
  entrepreneurId: string,
  message: string
): CollaborationRequest => {
  const newRequest: CollaborationRequest = {
    id: `req${collaborationRequests.length + 1}`,
    investorId,
    entrepreneurId,
    message,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  collaborationRequests.push(newRequest);
  return newRequest;
};