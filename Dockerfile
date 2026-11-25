ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS build
WORKDIR /opt/dnspod-ddns
# 使用 BuildKit 缓存 npm;ci.js 测速选源写 .cache/ci-registry 指针,
# 由 npm 在安装时原地替换 lock 各 resolved 的 host,全程不改写 lock(故只读挂载即可)
RUN --mount=type=cache,id=npm,target=/root/.npm \
    --mount=type=bind,target=/opt/dnspod-ddns/package.json,source=package.json \
    --mount=type=bind,target=/opt/dnspod-ddns/package-lock.json,source=package-lock.json \
    --mount=type=bind,target=/opt/dnspod-ddns/modules/,source=modules/ \
    node modules/ci.js && npm ci --omit=dev --omit=optional --no-audit --no-fund --progress=false --registry="$(cat .cache/ci-registry)" --replace-registry-host=always

FROM node:${NODE_VERSION} AS runtime
WORKDIR /opt/dnspod-ddns

# 运行时环境与日志
ENV NODE_ENV=production \
    npm_config_loglevel=warn

COPY index.js healthcheck.js ./
# 2025-11 BuildKit 缓存重构时误删了 modules/ 与 package.json 的 COPY:
# index.js 依赖 modules/,dnspod-api.js 顶层读取 package.json,缺失则镜像启动即 ENOENT
COPY modules/ ./modules/
COPY package.json ./package.json
COPY --from=build /opt/dnspod-ddns/node_modules ./node_modules/

# 心跳健康检查:进程假死但容器未退出时(Docker 无从感知)向 Docker/DSM 暴露 unhealthy
HEALTHCHECK --interval=5m --timeout=10s --retries=2 --start-period=5m CMD ["node", "healthcheck.js"]

ENTRYPOINT ["node", "index.js"]
