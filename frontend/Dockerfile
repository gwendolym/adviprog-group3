FROM node:22-alpine AS development
WORKDIR /app
RUN npm install -g npm@11
COPY package*.json ./
RUN npm ci
COPY . .
ENV NODE_ENV=development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g npm@11
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

FROM node:22-alpine AS production
WORKDIR /app
USER node
COPY --from=builder --chown=node:node /app/build build/
COPY --from=builder --chown=node:node /app/node_modules node_modules/
COPY --from=builder --chown=node:node /app/package.json package.json
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD [ "node", "build" ]