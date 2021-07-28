FROM node:10

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm i

COPY ./src ./src
COPY ./tsconfig.json ./

EXPOSE 5108

CMD [ "npm", "run", "start"]
