# --- Build Stage ---
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build production bundle
RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine

# Copy compiled static assets from build stage to Nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support client-side routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
