# CS Tool API (NestJS). Published as ghcr.io/kasunrocz-softwares/cs-tool-api.
# Build from the repo root:  docker build -f docker/backend.Dockerfile .
# The image carries the database/ migrations at /database (where scripts/migrate.js looks), so it
# needs no bind mount. Configuration comes from environment variables at run time; no .env is baked in.
FROM node:22-slim AS build
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./
RUN npm install
COPY backend/ ./
RUN npm run build

FROM node:22-slim
LABEL org.opencontainers.image.title="CS Tool API" \
      org.opencontainers.image.description="Self-hosted server and security monitoring: REST + WebSocket API" \
      org.opencontainers.image.url="https://qulaxy.com/cs-tool/" \
      org.opencontainers.image.source="https://github.com/KasunRocz-Softwares/cs-tool" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="KasunRocz Softwares"
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY backend/scripts ./scripts
COPY database /database
EXPOSE 4000
# Apply the schema and migrations (and make sure the admin account exists), then start the API.
CMD ["sh", "-c", "node scripts/migrate.js && node dist/main.js"]
