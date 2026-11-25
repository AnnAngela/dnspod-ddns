import fs from "fs";

// 心跳文件:每次 onTick 触发时更新,healthcheck.js 以其 mtime 判断"事件循环活着且 cron 在触发"。
// 路径固定而非环境变量可配:index.js 与 healthcheck.js 必须指向同一文件,固定值最不易配错。
const HEARTBEAT_FILE = "/tmp/dnspod-ddns-heartbeat";

const writeHeartbeat = () => fs.writeFileSync(HEARTBEAT_FILE, new Date().toISOString());
export { HEARTBEAT_FILE };
export default writeHeartbeat;
