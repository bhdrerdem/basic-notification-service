FROM node:20-alpine AS build

WORKDIR /server

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /server

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=build /server/dist ./dist

CMD ["node", "dist/index.js"]