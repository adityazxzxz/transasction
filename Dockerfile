FROM node:16.13.1-alpine3.13 AS base


WORKDIR /usr/src/app
COPY package*.json ./


RUN npm install xml-js
RUN npm install

COPY . .
EXPOSE 3000


