FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build ai-service

CMD ["node", "dist/apps/ai-service/main"]