FROM node:22

WORKDIR /app

# We only need the scripts from the root folder
# Install packages for the front and back
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install --omit=dev --prefix backend
RUN npm install --prefix frontend

COPY backend ./backend
COPY frontend ./frontend

RUN npm run build
RUN rm -rf frontend

EXPOSE 3000

CMD ["npm", "start", "--prefix", "backend"]