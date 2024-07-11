FROM node:lts AS build

# Install dumb-init
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

# Install dependencies with yarn
RUN yarn install

COPY . .

# Build the app
RUN yarn build

#### Build Time Finished ####

FROM node:lts-bullseye-slim

USER node
ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./
RUN ["yarn", "install"]

COPY --from=build /usr/bin/dumb-init /usr/bin/dumb-init
COPY --chown=node:node --from=build /usr/src/app/dist .
COPY --chown=node:node --from=build /usr/src/app/migrations ./migrations

COPY knexfile.js .

EXPOSE 3000

CMD [ "npm knex migrate:latest && dumb-init node index.js"]