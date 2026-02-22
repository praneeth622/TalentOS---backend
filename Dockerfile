FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files first (layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Copy rest of source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript to dist/
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

EXPOSE 5001

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
