ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /opt/dnspod-ddns
# 使用 BuildKit 缓存 npm
RUN --mount=type=cache,id=npm,target=/root/.npm \
    --mount=type=bind,target=/opt/dnspod-ddns/package-lock.json,source=package-lock.json \
    --mount=type=bind,target=/opt/dnspod-ddns/modules/,source=modules/ \
    node modules/ci.js && npm ci --omit=dev --omit=optional --no-audit --no-fund --progress=false

FROM node:${NODE_VERSION} AS runtime
WORKDIR /opt/dnspod-ddns

# 运行时环境与日志
ENV NODE_ENV=production \
    npm_config_loglevel=warn

COPY --from=build /opt/dnspod-ddns/index.js ./index.js
COPY --from=build /opt/dnspod-ddns/modules ./modules/
COPY --from=build /opt/dnspod-ddns/node_modules ./node_modules/

ENTRYPOINT ["node", "index.js"]
