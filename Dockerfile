FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app

# Only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Built JS from builder stage
COPY --from=builder /app/dist ./dist

# Landing page
COPY index.html ./

# Non-root user for security
RUN addgroup -S solbot && adduser -S solbot -G solbot
USER solbot

EXPOSE 3000

# Private key comes ONLY from environment variable at runtime
# Never baked into the image
CMD ["node", "dist/server.js"]
