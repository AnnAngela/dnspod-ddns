FROM node:lts-alpine as BUILD
WORKDIR /opt/dnspod-ddns
COPY . .
RUN node modules/ci.js && npm ci && npm prune --omit=dev && npm i -g node-prune && npx node-prune
FROM node:lts-alpine
WORKDIR /opt/dnspod-ddns
COPY --from=BUILD /opt/dnspod-ddns .
CMD ["node","index.js"];
