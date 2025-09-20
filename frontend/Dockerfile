# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Enable corepack for Yarn 4 support
RUN corepack enable

# Copy package.json first (for better caching)
COPY package.json ./

# Copy yarn.lock if it exists, otherwise skip
COPY yarn.loc[k] ./

# Install dependencies
RUN yarn install

# Copy the rest of the application
COPY . .

# Expose port 5173 for Vite dev server
EXPOSE 5173

# Start the development server with host binding for Docker
CMD ["yarn", "dev", "--host", "0.0.0.0"]