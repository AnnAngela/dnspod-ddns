FROM node:lts-alpine as BUILD
WORKDIR /opt/dnspod-ddns
COPY . .
RUN node modules/ci.js && npm ci && npm prune --production && npx node-prune
FROM node:lts-alpine
WORKDIR /opt/dnspod-ddns
COPY --from=BUILD /opt/dnspod-ddns .
CMD ["node","index.js"];
