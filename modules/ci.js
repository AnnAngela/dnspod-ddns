import fs from "node:fs";
import path from "node:path";
import console from "node:console";

// 本脚本运行于 node_modules 尚不存在之时(npm ci 之前),届时任何第三方包都不可用,
// 故必须零第三方依赖、不得引用 modules/ 下的任何其他文件(尽管它们当前也零依赖,
// 但未来可能引入依赖)——参考 MoegirlPediaInterfaceCodes 的同类脚本约定:
// 其 ci 脚本曾因引用的 modules/console.js 顶层导入第三方包而在 CI 全新环境崩溃。
const info = (...args) => console.info(`[${new Date().toISOString()}]`, ...args);
const split = (length = 120) => console.info("=".repeat(length));
info("Start initialization...");

// 指针文件:把测速选出的 registry 落盘到已 gitignore 的 .cache/,
// 供调用方(Dockerfile / test.yaml)读取后传给
// `npm ci --registry=<registry> --replace-registry-host=always`,
// 由 npm 在安装时把 package-lock.json 各 resolved 的 host 原地替换为该源。
// 全程不读取、不修改 lock 文件,工作区不产生 diff——旧实现读改写 lock,
// 本地运行后总会残留 resolved URL 重写的无关变更,且一律重写为 npmjs
// 对本地(国内)环境并不总是最快。
const registryPointerFile = path.join(".cache", "ci-registry");

const registries = [
    "https://registry.npmjs.org/",
    "https://registry.npmmirror.com/",
];
// 测速目标用真实依赖包路径,比根路径更接近 npm ci 的实际请求模式;
// fetch 对 4xx/5xx 不 reject,故"收到响应"即视为测得一次延迟
const targetPath = "cron/latest";

// 每源并发测 5 次 HEAD、单次 3 秒超时,取成功请求的最小延迟,
// 全部失败计为 Number.MAX_SAFE_INTEGER(排序垫底)——离线时两源皆垫底,
// 排序稳定,退回 registries[0] 由 npm ci 照常报错
const testLatency = async (urls, times = 5, timeout = 3000) => {
    info("[testLatency]", "urls:", urls);
    info("[testLatency]", "times:", times);
    info("[testLatency]", "timeout:", timeout);
    const latency = await Promise.all(urls.map(async (url) => {
        const result = await Promise.allSettled(Array.from({ length: times }, async () => {
            const controller = new AbortController();
            const timeoutRef = setTimeout(() => controller.abort(), timeout);
            const start = process.hrtime.bigint();
            try {
                await fetch(url, { method: "HEAD", signal: controller.signal });
            } finally {
                clearTimeout(timeoutRef);
            }
            return Number(process.hrtime.bigint() - start) / 10 ** 6;
        }));
        return [url, result.reduce((p, { status, value }) => status === "fulfilled" ? Math.min(p, value) : p, Number.MAX_SAFE_INTEGER)];
    }));
    info("[testLatency]", "latency:", latency);
    return latency;
};

const latency = await testLatency(registries.map((base) => `${base}${targetPath}`));
const targetRegistry = latency.sort(([, a], [, b]) => a - b)[0][0].replace(targetPath, "");
info("targetRegistry:", targetRegistry);
await fs.promises.mkdir(".cache", { recursive: true });
await fs.promises.writeFile(registryPointerFile, targetRegistry, "utf8");
info("registry pointer written:", registryPointerFile);
info("Done.");
split();
