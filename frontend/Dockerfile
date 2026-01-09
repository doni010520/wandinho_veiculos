FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Hardcoded - muda aqui se mudar a URL do backend
ENV VITE_API_URL=https://benitech-wandinho.x3t6qy.easypanel.host/api

RUN npm run build

FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
