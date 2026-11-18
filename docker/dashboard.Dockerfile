# CS Tool dashboard (Next.js, standalone). Published as ghcr.io/kasunrocz-softwares/cs-tool-dashboard.
# Build from the repo root:  docker build -f docker/dashboard.Dockerfile .
# The browser calls /api and /socket.io on the same address it loaded the dashboard from; the proxy in
# deploy/docker-compose.yml sends those to the API, so one image works on any domain or port.
FROM node:22-slim AS build
WORKDIR /app
# Next bakes rewrite destinations at build time; "backend" is the API's service name in the compose file.
ARG BACKEND_URL=http://backend:4000
ENV BACKEND_URL=$BACKEND_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY dashboard/package.json dashboard/package-lock.json* ./
RUN npm install
COPY dashboard/ ./
RUN npm run build

FROM node:22-slim
LABEL org.opencontainers.image.title="CS Tool Dashboard" \
      org.opencontainers.image.description="Self-hosted server and security monitoring: web dashboard" \
      org.opencontainers.image.url="https://qulaxy.com/cs-tool/" \
      org.opencontainers.image.source="https://github.com/KasunRocz-Softwares/cs-tool" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.vendor="KasunRocz Softwares"
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=5173
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
USER node
EXPOSE 5173
CMD ["node", "server.js"]
