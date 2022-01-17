FROM node:16-alpine AS base

WORKDIR /m2mam

FROM base AS builder

COPY . ./

RUN yarn
RUN yarn build

FROM base AS runner

ENTRYPOINT ["/sbin/tini", "--"]

ENV NODE_ENV=production

COPY --from=builder /m2mam/package.json ./package.json
COPY --from=builder /m2mam/dist ./dist

RUN yarn

CMD ["npm", "run", "start"]
