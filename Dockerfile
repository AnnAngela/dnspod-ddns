ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /opt/dnspod-ddns
# 使用 BuildKit 缓存 npm
RUN --mount=type=cache,id=npm,target=/root/.npm \
    --mount=type=bind,target=/opt/dnspod-ddns/package.json,source=package.json \
    --mount=type=bind,target=/opt/dnspod-ddns/package-lock.json,source=package-lock.json,readwrite \
    --mount=type=bind,target=/opt/dnspod-ddns/modules/,source=modules/ \
    node modules/ci.js && npm ci --omit=dev --omit=optional --no-audit --no-fund --progress=false

FROM node:${NODE_VERSION} AS runtime
WORKDIR /opt/dnspod-ddns

# 运行时环境与日志
ENV NODE_ENV=production \
    npm_config_loglevel=warn

COPY index.js ./
# 2025-11 BuildKit 缓存重构时误删了 modules/ 与 package.json 的 COPY:
# index.js 依赖 modules/,dnspod-api.js 顶层读取 package.json,缺失则镜像启动即 ENOENT
COPY modules/ ./modules/
COPY package.json ./package.json
COPY --from=build /opt/dnspod-ddns/node_modules ./node_modules/

ENTRYPOINT ["node", "index.js"]
