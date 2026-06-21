FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache docker-cli curl

COPY api-gateway/package*.json ./
RUN npm install

COPY api-gateway/ ./

EXPOSE 8000

CMD ["npm", "start"]
