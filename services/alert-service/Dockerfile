FROM node:18-alpine

WORKDIR /app

COPY services/alert-service/package*.json ./
RUN npm install --omit=dev

COPY services/alert-service/ ./

ENV NODE_ENV=production

EXPOSE 7102

CMD ["npm", "start"]
