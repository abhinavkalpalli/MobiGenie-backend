FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build phone-service

CMD ["node", "dist/apps/phone-service/main"]