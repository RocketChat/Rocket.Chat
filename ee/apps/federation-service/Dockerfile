FROM oven/bun:1.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S rocketchat && \
    adduser -S -u 1001 -G rocketchat rocketchat

# Copy built application
COPY --from=builder --chown=rocketchat:rocketchat /app/package.json ./
COPY --from=builder --chown=rocketchat:rocketchat /app/node_modules ./node_modules
COPY --from=builder --chown=rocketchat:rocketchat /app/src ./src

# Set user
USER rocketchat

# Set environment for microservice mode
ENV TRANSPORTER=nats://localhost:4222
ENV FEDERATION_SERVICE_PORT=3030
ENV HEALTH_PORT=4000

# Expose ports
EXPOSE 3030 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD bun run health-check || exit 1

# Start the service
CMD ["bun", "run", "start"]