FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY services/api/package.json services/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
RUN npm run build -w packages/shared && npm run build -w services/api
CMD ["npm","run","start","-w","services/api"]
