FROM node:8-alpine
LABEL maintainer="Felipe Lalanne <flalanne@niclabs.cl>"

ENV PRODUCTION=false

# Install dependencies
RUN npm install -g yarn && mkdir -p /opt/bot
WORKDIR /opt/bot
COPY * ./

# Install node dependencies
RUN yarn --production=${PRODUCTION} && yarn cache clean

CMD ["yarn", "start"]