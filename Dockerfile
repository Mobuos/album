# syntax=docker/dockerfile:1

ARG NODE_VERSION=22


## Backend stage
FROM node:${NODE_VERSION}-alpine AS backend

WORKDIR /usr/src/app/backend
COPY backend/package*.json ./

#FIXME: Temporary uploads folder, will not persist between deploys
RUN mkdir -p uploads

RUN npm ci --omit-dev

COPY backend .
RUN npx prisma generate


## Frontend build stage
FROM node:${NODE_VERSION}-alpine AS frontend

WORKDIR /usr/src/app/frontend
COPY frontend/package*.json ./

RUN npm ci

COPY frontend .

RUN npm run build


## Final Stage
FROM node:${NODE_VERSION}-alpine AS production

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci

COPY test.js .
COPY test_tulips.png .

COPY --from=frontend /usr/src/app/frontend/dist ./backend/public
COPY --from=backend /usr/src/app/backend ./backend

EXPOSE 3000

CMD ["node", "backend/index.js"]