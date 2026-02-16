# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# We no longer use build ARGs/ENVs for Vite variables here.
# Instead, we COPY the .env file and let Vite read it during build.

COPY package*.json ./
RUN npm install

# Copy all files including .env
COPY . .

# Remove .env.production to force usage of local .env for this build
RUN rm -f .env.production

# Run build - Vite will pick up .env from the current directory
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
