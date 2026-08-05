# ─── Build Stage ──────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

# Copy build files from builder stage
COPY --from=builder /usr/src/app/dist ./dist
# Copy backend files
COPY --from=builder /usr/src/app/server ./server

EXPOSE 5000

CMD ["node", "server/server.js"]
