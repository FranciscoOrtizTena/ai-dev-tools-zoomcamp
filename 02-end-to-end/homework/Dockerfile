# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies for backend and frontend using lockfiles
COPY backend/package.json backend/package-lock.json backend/
COPY frontend/package.json frontend/package-lock.json frontend/
RUN npm --prefix backend ci \
  && npm --prefix frontend ci

# Copy source and build
COPY backend backend
COPY frontend frontend
RUN npm --prefix backend run build
RUN npm --prefix frontend run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
  PORT=8080 \
  CLIENT_ORIGIN=http://localhost:8080

# Install production deps for backend only
COPY --from=builder /app/backend/package.json /app/backend/package-lock.json ./backend/
RUN npm --prefix backend ci --omit=dev

# Copy built assets
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/openapi.yaml ./backend/openapi.yaml
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
CMD ["node", "backend/dist/index.js"]
