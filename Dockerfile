# Use official Node.js LTS image (Alpine for smaller size)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json first for caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy the rest of the application
COPY . .

# Optional: copy .env only if needed locally (not recommended for production)
# COPY .env . 

# Set default port (can be overridden by hosting platform)
ENV PORT=4000

# Expose the port
EXPOSE $PORT

# Start the server
CMD ["node", "src/server.js"]
