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
      user?: {
        primaryEmailAddress?: {
          emailAddress: string;
        };
        emailAddresses?: Array<{
          emailAddress: string;
        }>;
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
      const urlString = typeof url === 'string' ? url : url.toString();
      
      if (isDeployedToCustomApiPath) {
        // Remove /routes/ segment from path if the api is deployed and made accessible through
        // another domain with custom path different from the default API path
        const modifiedUrl = urlString.replace(API_PREFIX_PATH + "/routes", API_PREFIX_PATH);
        return fetch(modifiedUrl, options);
      }

      // In development mode, prepend /api to all requests to match Vite proxy configuration
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Extract pathname from full URL if needed
        let pathToCheck = urlString;
        if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
          try {
            const urlObj = new URL(urlString);
            pathToCheck = urlObj.pathname + urlObj.search;
          } catch (e) {
            console.error(`[Brain Client] Failed to parse URL: ${urlString}`, e);
            return fetch(url, options);
          }
        }
        
        // Only add /api prefix if the path starts with /routes and doesn't already start with /api
        if (pathToCheck.startsWith('/routes') && !pathToCheck.startsWith('/api')) {
          const modifiedUrl = `/api${pathToCheck}`;
          return fetch(modifiedUrl, options);
        }
      }

      return fetch(url, options);
    },
    securityWorker: async () => {
      // SIMPLIFIED: Just try to get user email and token from Clerk
      try {
        let userEmail = '';
        let token = null;
        
        // Get user info from Clerk if available
        if (window.Clerk) {
          // Get user email
          if (window.Clerk.user) {
            userEmail = window.Clerk.user.primaryEmailAddress?.emailAddress || 
                       window.Clerk.user.emailAddresses?.[0]?.emailAddress || '';
          }
          
          // Get token
          if (window.Clerk.session?.getToken) {
            try {
              token = await window.Clerk.session.getToken();
            } catch (error) {
              console.log('Could not get Clerk token:', error);
            }
          }
        }
        
        // Build headers - always include email for super admin check
        const headers: any = {};
        if (userEmail) {
          headers['X-User-Email'] = userEmail;
        }
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        console.log('🔍 Security Worker - Headers:', { hasEmail: !!userEmail, hasToken: !!token });
        return { headers };
        
      } catch (error) {
        console.error('Security worker error:', error);
        return { headers: {} };
      }
    },
  });
};

const brain = constructClient();

export default brain;
