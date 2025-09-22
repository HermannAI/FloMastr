# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Set Node.js memory options to prevent OOM in Codespaces
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package.json first (for better caching)
COPY package.json ./

# Copy package-lock.json if it exists
COPY package-lock.json* ./

# Install dependencies with npm
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port 5173 for Vite dev server
EXPOSE 5173

# Start the development server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]