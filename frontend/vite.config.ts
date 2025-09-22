import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Support for GitHub Codespaces
const isCodespace = !!process.env.CODESPACE_NAME;
const codespaceBaseUrl = isCodespace ? `https://${process.env.CODESPACE_NAME}-8000.app.github.dev` : undefined;

const buildVariables = () => {
	// Use Codespaces URL when in Codespaces environment, otherwise fall back to env var or default
	const apiUrl = process.env.VITE_API_BASE_URL || codespaceBaseUrl || "http://localhost:8000";

	const defines: Record<string, string> = {
		__APP_ID__: JSON.stringify("flo-mastr"),
		__API_PATH__: JSON.stringify(""),
		__API_HOST__: JSON.stringify(apiUrl.replace(/^https?:\/\//, "")),
		__API_PREFIX_PATH__: JSON.stringify(""),
		__API_URL__: JSON.stringify(apiUrl),
		__WS_API_URL__: JSON.stringify(apiUrl.replace(/^http/, "ws")),
		__APP_BASE_PATH__: JSON.stringify("/"),
		__APP_TITLE__: JSON.stringify("FloMastr"),
		__APP_FAVICON_LIGHT__: JSON.stringify("/favicon-light.svg"),
		__APP_FAVICON_DARK__: JSON.stringify("/favicon-dark.svg"),
		__APP_DEPLOY_USERNAME__: JSON.stringify(""),
		__APP_DEPLOY_APPNAME__: JSON.stringify(""),
		__APP_DEPLOY_CUSTOM_DOMAIN__: JSON.stringify(""),
	};

	return defines;
};

export default defineConfig({
	define: buildVariables(),
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
			'brain': path.resolve(__dirname, './src/brain'),
			'components': path.resolve(__dirname, './src/components'),
			'pages': path.resolve(__dirname, './src/pages'),
			'app': path.resolve(__dirname, './src/app'),
			'utils': path.resolve(__dirname, './src/utils'),
		},
	},
	server: {
		host: true,
		// Removed HTTPS settings that were used locally
		proxy: {
			'/api': {
				target: isCodespace ? 'http://localhost:8000' : 'http://backend:8000',
				changeOrigin: true,
				secure: false, // Critical for HTTPS→HTTP
				rewrite: (path) => {
					const newPath = path.replace(/^\/api/, '');
					console.log(`[Vite Proxy] Rewriting path: ${path} → ${newPath}`);
					return newPath;
				},
				configure: (proxy, options) => {
					proxy.on('error', (err, req, res) => {
						console.log('[Vite Proxy] Error:', err);
					});
					proxy.on('proxyReq', (proxyReq, req, res) => {
						console.log(`[Vite Proxy] Forwarding request: ${req.method} ${req.url}`);
					});
				}
			},
			'/routes': {
				target: isCodespace ? 'http://localhost:8000' : 'http://backend:8000',
				changeOrigin: true,
				secure: false,
				configure: (proxy, options) => {
					proxy.on('error', (err, req, res) => {
						console.log('[Vite Proxy] Error:', err);
					});
					proxy.on('proxyReq', (proxyReq, req, res) => {
						console.log(`[Vite Proxy] Forwarding request: ${req.method} ${req.url}`);
					});
				}
			}
		},
	},
});
