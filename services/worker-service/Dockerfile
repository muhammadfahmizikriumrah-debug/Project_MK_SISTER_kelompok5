FROM node:18-alpine

# Install dependencies for sharp
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

COPY package*.json ./

RUN npm install --production

COPY . .

CMD ["npm", "start"]
