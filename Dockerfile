FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm pkg delete scripts.prepare && npm ci --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]
