// Docker HEALTHCHECK 入口:以心跳文件 mtime 判断应用是否存活。
// 判活语义 = "事件循环活着且 cron 按计划触发",与 DNSPod 记录是否更新成功解耦。
import fs from "fs";
import { CronTime } from "cron";
import console from "./modules/console.js";
import { HEARTBEAT_FILE } from "./modules/heartbeat.js";

const CRON = process.env.CRON?.trim() || "0 */5 * * * *";

// 容忍连续错过 3 个调度周期再 + 10 分钟缓冲,避免慢启动、单次事件循环卡顿或宿主机高负载误报;
// 阈值随 CRON 周期自适应(如每小时任务允许最长约 3 小时 10 分无心跳)。
const MAX_MISSES = 3;
const BUFFER_MS = 10 * 60 * 1000;

const fail = (message) => {
    console.error(message);
    process.exit(1);
};

let stat;
try {
    stat = fs.statSync(HEARTBEAT_FILE);
} catch {
    fail(`心跳文件 ${HEARTBEAT_FILE} 不存在:应用从未成功执行过任务(启动即崩溃或已假死)`);
}

let periodMs;
try {
    const [next, nextNext] = new CronTime(CRON).sendAt(2);
    periodMs = nextNext.diff(next).as("milliseconds");
} catch (e) {
    fail(`CRON 表达式无法解析,健康检查无法计算阈值:${e.message || e}`);
}

const age = Date.now() - stat.mtimeMs;
const thresholdMs = MAX_MISSES * periodMs + BUFFER_MS;
if (age > thresholdMs) {
    fail(`心跳已过期 ${Math.round(age / 1000)} 秒(阈值 ${Math.round(thresholdMs / 1000)} 秒),应用已假死或任务停止触发`);
}
console.info("心跳新鲜,应用健康");
