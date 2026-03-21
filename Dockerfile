FROM node:20-slim

WORKDIR /app

# Install dependencies for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src/
COPY prisma.config.ts ./

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
