FROM node:lts AS build
WORKDIR /opt/dnspod-ddns
COPY . .
RUN node modules/ci.js && npm ci && npm prune --omit=dev && curl -sf https://raw.githubusercontent.com/tuananh/node-prune/develop/prune.sh | sh
FROM node:lts-alpine
WORKDIR /opt/dnspod-ddns
COPY --from=build /opt/dnspod-ddns/index.js /opt/dnspod-ddns/package.json ./
COPY --from=build /opt/dnspod-ddns/modules ./modules/
COPY --from=build /opt/dnspod-ddns/node_modules ./node_modules/
CMD ["node", "index.js"]
