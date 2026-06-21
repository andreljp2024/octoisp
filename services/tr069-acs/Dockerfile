FROM node:18-alpine

WORKDIR /app

COPY services/tr069-acs/package*.json ./
RUN npm install --omit=dev

COPY services/tr069-acs/ ./

ENV NODE_ENV=production

EXPOSE 7547

CMD ["npm", "start"]
