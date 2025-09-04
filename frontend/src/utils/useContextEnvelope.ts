


import { useQuery } from '@tanstack/react-query';
import brain from 'brain';
import { ContextEnvelope } from 'brain/data-contracts';

interface UseContextEnvelopeParams {
  tenantId: string;
  contactId?: string | null;
  whatsapp?: string | null;
  enabled?: boolean;
}

interface UseContextEnvelopeResult {
  data: ContextEnvelope | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React Query hook for fetching Context Envelope data
 * 
 * @param params - Parameters for the context envelope request
 * @param params.tenantId - Tenant identifier (required)
 * @param params.contactId - Contact UUID (optional)
 * @param params.whatsapp - WhatsApp number in E.164 format (optional)
 * @param params.enabled - Whether the query should run (default: true)
 * 
 * Note: Either contactId OR whatsapp must be provided
 */
export const useContextEnvelope = ({
  tenantId,
  contactId,
  whatsapp,
  enabled = true
}: UseContextEnvelopeParams): UseContextEnvelopeResult => {
  
  // Validate that at least one contact identifier is provided
  const hasValidParams = Boolean(
    tenantId && (contactId || whatsapp)
  );
  
  const query = useQuery({
    queryKey: ['contextEnvelope', tenantId, contactId, whatsapp],
    queryFn: async (): Promise<ContextEnvelope> => {
      // Validate parameters before making the request
      if (!tenantId) {
        throw new Error('Tenant ID is required');
      }
      
      if (!contactId && !whatsapp) {
        throw new Error('Either contact_id or whatsapp must be provided');
      }
      
      try {
        const response = await brain.get_context_envelope({
          tenant_id: tenantId,
          contact_id: contactId,
          whatsapp: whatsapp
        });
        
        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 401) {
            throw new Error('Session expired');
          }
          if (response.status === 404) {
            throw new Error('Contact or tenant not found');
          }
          if (response.status === 400) {
            throw new Error('Invalid request parameters');
          }
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Context envelope fetch error:', error);
        throw error;
      }
    },
    enabled: enabled && hasValidParams,
    staleTime: 60 * 1000, // 60 seconds to match backend cache TTL
    gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)
    retry: (failureCount, error) => {
      // Don't retry on 401 (auth) or 404 (not found) errors
      if (error instanceof Error && 
          (error.message.includes('Session expired') || 
           error.message.includes('not found'))) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    onError: (error) => {
      console.error('Context envelope query error:', error);
    }
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch
  };
};
