# stage 1 building the code
FROM node:18-alpine as builder
WORKDIR /usr/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# stage 2
FROM node:18-alpine
WORKDIR /usr/app
COPY --from=builder /usr/app/dist ./dist
COPY --from=builder /usr/app/node_modules ./node_modules/
COPY --from=builder /usr/app/package*.json ./

EXPOSE 35515

CMD node dist/main.js
