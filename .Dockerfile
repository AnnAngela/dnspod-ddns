FROM node:lts-alpine
WORKDIR /opt/dnspod-ddns
COPY . .
RUN npm ci
CMD ["node","index.js"];
