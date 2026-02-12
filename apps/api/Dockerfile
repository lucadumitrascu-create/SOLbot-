FROM node:20-slim AS base
RUN corepack enable

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build
WORKDIR /app/apps/api
RUN pnpm build

# Production stage
FROM node:20-slim AS production
RUN corepack enable

WORKDIR /app

COPY --from=base /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/apps/api/package.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/index.js"]
