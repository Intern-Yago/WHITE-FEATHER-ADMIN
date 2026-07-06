# Use Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy frontend source code
COPY . .

# Expose port 5173
EXPOSE 5173

# Run the development server, binding to 0.0.0.0 so it is accessible from the host
CMD ["pnpm", "run", "dev", "--host"]
