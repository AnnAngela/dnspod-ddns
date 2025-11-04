ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /opt/dnspod-ddns
# 仅拷贝清单文件以最大化缓存命中
COPY package*.json modules/ ./
# 使用 BuildKit 缓存 npm
RUN --mount=type=cache,id=npm,target=/root/.npm \
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
