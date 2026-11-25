# Build the single page application
FROM node:24-alpine AS build

WORKDIR /app

COPY src/Frontend/ ./
RUN npm ci
RUN npx quasar build

# Serve the single page application
FROM nginx:alpine

# Listen ports
EXPOSE 80

COPY src/nginx-security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY src/nginx-default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/spa /usr/share/nginx/html
