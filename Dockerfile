# syntax=docker/dockerfile:1

ARG NODE_VERSION=22


## Backend stage
FROM node:${NODE_VERSION}-alpine AS backend

WORKDIR /usr/src/app/backend
COPY backend/package*.json ./

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

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY --from=frontend /usr/src/app/frontend/dist ./public
COPY --from=backend /usr/src/app/backend .

EXPOSE 3000

CMD ["node", "index.js"]