# Dockerfile for Study Plan Next.js App
# Multi-stage build using Node.js

FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY study-app/package.json study-app/package-lock.json* ./
RUN npm ci

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY study-app/ .

# Copy markdown content from parent directories
COPY day1-python-backend-db/ /content/day1-python-backend-db/
COPY day2-react-security/ /content/day2-react-security/
COPY day3-k8s-linux-ml/ /content/day3-k8s-linux-ml/
COPY day4-review/ /content/day4-review/

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy markdown content for runtime
COPY --from=builder /content /content

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
