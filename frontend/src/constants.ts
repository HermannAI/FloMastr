export enum Mode {
  DEV = "development",
  PROD = "production",
}

interface WithEnvMode {
  readonly env: {
    readonly MODE: Mode;
  };
}

export const mode = (import.meta as unknown as WithEnvMode).env.MODE;

// Helper to get defined value or fallback to environment variable
const getDefinedOrEnv = (defined: any, envKey: string, fallback: string): string => {
  if (typeof defined !== 'undefined') return defined;
  return import.meta.env[envKey] || fallback;
};

// Get API URL from environment or default
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// App constants - work in both dev and build modes
declare const __APP_ID__: string;
export const APP_ID = typeof __APP_ID__ !== 'undefined' ? __APP_ID__ : 'flo-mastr';

declare const __API_PATH__: string;
export const API_PATH = typeof __API_PATH__ !== 'undefined' ? __API_PATH__ : '';

declare const __API_URL__: string;
export const API_URL = typeof __API_URL__ !== 'undefined' ? __API_URL__ : apiUrl;

declare const __API_HOST__: string;
export const API_HOST = typeof __API_HOST__ !== 'undefined' ? __API_HOST__ : apiUrl.replace(/^https?:\/\//, '');

declare const __API_PREFIX_PATH__: string;
export const API_PREFIX_PATH = typeof __API_PREFIX_PATH__ !== 'undefined' ? __API_PREFIX_PATH__ : '';

declare const __WS_API_URL__: string;
export const WS_API_URL = typeof __WS_API_URL__ !== 'undefined' ? __WS_API_URL__ : apiUrl.replace(/^http/, 'ws');

declare const __APP_BASE_PATH__: string;
export const APP_BASE_PATH = typeof __APP_BASE_PATH__ !== 'undefined' ? __APP_BASE_PATH__ : '/';

declare const __APP_TITLE__: string;
export const APP_TITLE = typeof __APP_TITLE__ !== 'undefined' ? __APP_TITLE__ : 'FloMastr';

declare const __APP_FAVICON_LIGHT__: string;
export const APP_FAVICON_LIGHT = typeof __APP_FAVICON_LIGHT__ !== 'undefined' ? __APP_FAVICON_LIGHT__ : '/favicon-light.svg';

declare const __APP_FAVICON_DARK__: string;
export const APP_FAVICON_DARK = typeof __APP_FAVICON_DARK__ !== 'undefined' ? __APP_FAVICON_DARK__ : '/favicon-dark.svg';

declare const __APP_DEPLOY_USERNAME__: string;
export const APP_DEPLOY_USERNAME = typeof __APP_DEPLOY_USERNAME__ !== 'undefined' ? __APP_DEPLOY_USERNAME__ : '';

declare const __APP_DEPLOY_APPNAME__: string;
export const APP_DEPLOY_APPNAME = typeof __APP_DEPLOY_APPNAME__ !== 'undefined' ? __APP_DEPLOY_APPNAME__ : '';

declare const __APP_DEPLOY_CUSTOM_DOMAIN__: string;
export const APP_DEPLOY_CUSTOM_DOMAIN = typeof __APP_DEPLOY_CUSTOM_DOMAIN__ !== 'undefined' ? __APP_DEPLOY_CUSTOM_DOMAIN__ : '';
