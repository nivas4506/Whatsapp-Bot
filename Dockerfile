# =========================================================
# Stage 1: Build & Dependencies
# =========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install build essentials for native packages if needed
RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src

# Compile TypeScript to /app/dist
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# =========================================================
# Stage 2: Hardened Production Runtime
# =========================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install dumb-init for proper PID 1 signal forwarding
RUN apk add --no-cache dumb-init curl

# Create non-root system user and group
USER node

# Copy production node_modules and compiled output
COPY --chown=node:node --from=builder /app/package*.json ./
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist

# Expose HTTP port
EXPOSE 3000

# Health check probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1

# Launch using dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
