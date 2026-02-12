# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# We no longer use build ARGs/ENVs for Vite variables here.
# Instead, we COPY the .env file and let Vite read it during build.

COPY package*.json ./
RUN npm ci

# Copy all files including .env
COPY . .

# Run build - Vite will pick up .env from the current directory
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
