# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine AS runner

WORKDIR /app

# Install a simple static server
RUN npm install -g serve

# Copy build artifacts from build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
