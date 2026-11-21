FROM node:22-alpine

WORKDIR /app

# Cài đặt đúng phiên bản thư viện từ package-lock.json
COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
