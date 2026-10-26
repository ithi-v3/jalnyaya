# JalNyaya Backend Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy root and backend package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# Install dependencies and generate Prisma Client
RUN npm install
RUN cd backend && npm install
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy source code
COPY backend/ ./backend/
COPY database/ ./database/

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "backend/src/server.js"]
