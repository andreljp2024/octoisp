FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache docker-cli curl

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start"]
