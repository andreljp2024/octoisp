FROM node:18-alpine

WORKDIR /app

COPY services/snmp-monitor/package*.json ./
RUN npm install --omit=dev

COPY services/snmp-monitor/ ./

ENV NODE_ENV=production

EXPOSE 7101

CMD ["npm", "start"]
