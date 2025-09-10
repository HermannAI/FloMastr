import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const buildVariables = () => {
	const apiUrl = process.env.VITE_API_URL || "http://localhost:8000";

	const defines: Record<string, string> = {
		__APP_ID__: JSON.stringify("flo-mastr"),
		__API_PATH__: JSON.stringify(""),
		__API_HOST__: JSON.stringify(apiUrl.replace(/^https?:\/\//, "")),
		__API_PREFIX_PATH__: JSON.stringify(""),
		__API_URL__: JSON.stringify(apiUrl),
		__WS_API_URL__: JSON.stringify("ws://localhost:8000"),
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
		},
	},
	server: {
		host: true,
		https: {
			key: fs.readFileSync(path.resolve(__dirname, '.certs/key.pem')),
			cert: fs.readFileSync(path.resolve(__dirname, '.certs/cert.pem')),
		},
		proxy: {
			'/routes': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				secure: false,
				configure: (proxy, options) => {
					// Add debug logging
					proxy.on('proxyReq', (proxyReq, req, res) => {
						console.log('🔄 PROXY: Forwarding request to backend:', req.method, req.url);
						console.log('🔄 PROXY: Target URL:', proxyReq.getHeader('host') + proxyReq.path);
						
						// Forward all cookies from the frontend to the backend
						if (req.headers.cookie) {
							proxyReq.setHeader('cookie', req.headers.cookie);
							console.log('🔄 PROXY: Forwarding cookies');
						}
						// Forward Authorization header
						if (req.headers.authorization) {
							proxyReq.setHeader('authorization', req.headers.authorization);
							console.log('🔄 PROXY: Forwarding authorization header');
						}
					});
					
					proxy.on('proxyRes', (proxyRes, req, res) => {
						console.log('🔄 PROXY: Received response from backend:', proxyRes.statusCode);
					});
					
					proxy.on('error', (err, req, res) => {
						console.error('🔄 PROXY ERROR:', err);
					});
				},
			},
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
				secure: false,
				configure: (proxy, options) => {
					proxy.on('proxyReq', (proxyReq, req, res) => {
						// Forward all cookies from the frontend to the backend
						if (req.headers.cookie) {
							proxyReq.setHeader('cookie', req.headers.cookie);
						}
						// Forward Authorization header
						if (req.headers.authorization) {
							proxyReq.setHeader('authorization', req.headers.authorization);
						}
					});
				},
			},
		},
	},
});
