FROM node:14.15

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN npm install

EXPOSE 5000

CMD [ "npm", "start" ]
