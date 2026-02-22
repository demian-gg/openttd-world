# ---
# Build Stage
# ---

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies, then copy source and compile.
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# ---
# Production Stage
# ---

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only.
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/src/server.js"]
