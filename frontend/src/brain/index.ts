import { API_HOST, API_PATH, API_PREFIX_PATH } from "../constants";
import { Brain } from "./Brain";
import type { RequestParams } from "./http-client";

// Type declarations for Clerk global
declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: () => Promise<string | null>;
      };
    };
  }
}
import { useAuth } from '@clerk/clerk-react';

const isDeployedToCustomApiPath = API_PREFIX_PATH !== API_PATH;

const constructBaseUrl = (): string => {
  if (isDeployedToCustomApiPath) {
    // Access via origin domain where webapp was hosted with given api prefix path
    const domain = window.location.origin || `https://${API_HOST}`;
    return `${domain}${API_PREFIX_PATH}`;
  }

  // In development, use the frontend server so Vite proxy can handle requests
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin;
  }

  // Access at configured proxy domain
  return `https://${API_HOST}${API_PATH}`;
};

type BaseApiParams = Omit<RequestParams, "signal" | "baseUrl" | "cancelToken">;

const constructBaseApiParams = (): BaseApiParams => {
  return {
    credentials: "include",
    secure: true,
  };
};

const constructClient = () => {
  const baseUrl = constructBaseUrl();
  const baseApiParams = constructBaseApiParams();

  return new Brain({
    baseUrl,
    baseApiParams,
    customFetch: (url, options) => {
      if (isDeployedToCustomApiPath) {
        // Remove /routes/ segment from path if the api is deployed and made accessible through
        // another domain with custom path different from the databutton proxy path
        const urlString = typeof url === 'string' ? url : url.toString();
        return fetch(urlString.replace(API_PREFIX_PATH + "/routes", API_PREFIX_PATH), options);
      }

      return fetch(url, options);
    },
    securityWorker: async () => {
      // Try to get JWT token from Clerk
      try {
        console.log('🔍 SECURITY WORKER: Starting token retrieval...');
        
        // Check if Clerk is available globally and has the correct API
        if (window.Clerk && typeof window.Clerk.session?.getToken === 'function') {
          console.log('🔍 SECURITY WORKER: Clerk object found, attempting to get token...');
          const token = await window.Clerk.session.getToken();
          console.log('🔍 SECURITY WORKER: Token retrieved:', token ? 'SUCCESS' : 'NULL', token ? `(${token.substring(0, 20)}...)` : '');
          
          if (token) {
            console.log('✅ SECURITY WORKER: Using Clerk session token from global Clerk object');
            return {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            };
          } else {
            console.log('❌ SECURITY WORKER: Clerk session.getToken() returned null');
          }
        } else {
          console.log('❌ SECURITY WORKER: Clerk not available or missing session.getToken method');
          console.log('   window.Clerk exists:', !!window.Clerk);
          console.log('   window.Clerk.session exists:', !!(window.Clerk?.session));
          console.log('   getToken method exists:', typeof window.Clerk?.session?.getToken === 'function');
        }
        
        // Fallback: try to get from localStorage (Clerk sometimes stores tokens there)
        console.log('🔍 SECURITY WORKER: Trying fallback token sources...');
        const clerkToken = localStorage.getItem('clerk-token') || 
                          localStorage.getItem('__clerk_token') ||
                          localStorage.getItem('clerk-session-token') ||
                          localStorage.getItem('__clerk_session_token') ||
                          sessionStorage.getItem('clerk-token') ||
                          sessionStorage.getItem('__clerk_token');
        
        if (clerkToken) {
          console.log('✅ SECURITY WORKER: Using Clerk token from localStorage/sessionStorage');
          return {
            headers: {
              Authorization: `Bearer ${clerkToken}`,
            },
          };
        } else {
          console.log('❌ SECURITY WORKER: No token found in fallback storage');
        }
        
        // Another fallback: try to get from cookies directly
        const cookies = document.cookie.split(';');
        console.log('🔍 SECURITY WORKER: Checking cookies for auth tokens...');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name.includes('clerk') || name.includes('session') || name.includes('jwt')) {
            console.log(`🔍 SECURITY WORKER: Found potential auth cookie: ${name} (length: ${value?.length || 0})`);
            if (value && value.length > 10) { // Basic check for valid token
              console.log('✅ SECURITY WORKER: Using token from cookie');
              return {
                headers: {
                  Authorization: `Bearer ${value}`,
                },
              };
            }
          }
        }
        
        console.log('❌ SECURITY WORKER: No authentication token found anywhere');
        return { headers: {} };
      } catch (error) {
        console.error('❌ SECURITY WORKER: Error getting Clerk token:', error);
        return { headers: {} };
      }
    },
  });
};

const brain = constructClient();

export default brain;
