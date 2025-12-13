# =============================================================================
# Build Stage
# =============================================================================

# Use Node.js 20 Alpine as the builder base image.
FROM node:20-alpine AS builder

# Set the working directory.
WORKDIR /app

# Copy package manifest files for dependency installation.
COPY package.json package-lock.json* ./

# Install dependencies using clean install for reproducible builds.
RUN npm ci

# Copy source files and static assets.
COPY . .

# Build the production bundle.
RUN npm run build

# =============================================================================
# Production Stage
# =============================================================================

# Use Nginx Alpine as the production base image.
FROM nginx:alpine AS production

# Configure Nginx with custom server settings.
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression for text-based assets.
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json image/svg+xml;

    # Add security headers to all responses.
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Apply long-term caching for static assets.
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Route all requests through index.html for SPA support.
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Expose a health check endpoint for container orchestration.
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Copy built assets from the builder stage.
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the application port.
EXPOSE 3000

# Start the Nginx server in foreground mode.
CMD ["nginx", "-g", "daemon off;"]
