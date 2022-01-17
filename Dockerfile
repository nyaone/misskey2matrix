FROM node:16-alpine AS base

ENV NODE_ENV=production

WORKDIR /m2mam

FROM base AS builder

COPY . ./

RUN yarn
RUN yarn build

FROM base AS runner

ENTRYPOINT ["/sbin/tini", "--"]

COPY --from=builder /m2mam/node_modules ./node_modules
COPY --from=builder /m2mam/dist ./dist

CMD ["npm", "run", "start"]
