FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY packages/api-contracts/package.json ./packages/api-contracts/package.json
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS web
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=base /app /app
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@psa/web"]

FROM node:22-alpine AS api
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=base /app /app
EXPOSE 3001
CMD ["npm", "run", "start", "-w", "@psa/api"]

FROM api AS worker
CMD ["node", "apps/api/dist/worker.js"]
