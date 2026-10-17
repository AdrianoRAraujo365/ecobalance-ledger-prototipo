FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY clients ./clients
RUN npm run build:frontends

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY . .
COPY --from=frontend-build /app/src/public/apps ./src/public/apps
USER node
EXPOSE 3000
# Migrations e seed são idempotentes; depois sobe o servidor
CMD ["sh", "-c", "npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all && node src/server.js"]
