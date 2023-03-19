FROM node:lts-alpine
WORKDIR /opt/dnspod-ddns
COPY . .
RUN node modules/ci.js && npm ci
CMD ["node","index.js"];
