# Base: install dependencies once, reused by every stage below
FROM node:22-alpine AS base
WORKDIR /backend
# The lockfile is written by npm 11; npm 10 (bundled with Node 22) rejects it as out of sync
RUN npm install -g npm@11
COPY package*.json ./
RUN npm ci
COPY . .

# Dev: run the Nest app with hot-reload against the bind-mounted source
FROM base AS development
ENV NODE_ENV=development
CMD ["npm", "run", "start:dev"]

# Build: compile TypeScript and generate the Prisma client
FROM base AS build
RUN npx prisma generate --config prisma7.config.ts
RUN npm run build

# Prod: slim runtime image with only production dependencies + the compiled output
FROM node:22-alpine AS production
WORKDIR /backend
ENV NODE_ENV=production
RUN npm install -g npm@11
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /backend/dist ./dist
COPY --from=build /backend/prisma ./prisma
COPY --from=build /backend/prisma7.config.ts ./prisma7.config.ts
CMD ["sh", "-c", "npx prisma migrate deploy --config prisma7.config.ts && node dist/main"]
