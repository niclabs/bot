FROM node:8-alpine as tests
LABEL maintainer="Felipe Lalanne <flalanne@niclabs.cl>"

# Install dependencies
RUN npm install -g yarn && \
    mkdir -p /opt/bot

ADD . /opt/bot
WORKDIR /opt/bot

# Install dependencies
RUN yarn

# Run linter and tests
RUN yarn build

FROM node:8-alpine

WORKDIR /opt/bot

# Install dependencies
RUN npm install -g yarn && \
    mkdir -p /opt/bot/bot

COPY --from=tests /opt/bot/*.js /opt/bot/
COPY --from=tests /opt/bot/bot/*.js /opt/bot/bot/
COPY --from=tests /opt/bot/package.json /opt/bot/
COPY --from=tests /opt/bot/yarn.lock /opt/bot/


# Install production dependencies
RUN yarn --production=true && yarn cache clean

CMD ["yarn", "start"]
