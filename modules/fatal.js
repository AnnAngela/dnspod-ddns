// 进程级兜底:2026-11-07 生产事故中,cron#467 抛错后 Node 默认 fatal 路径未完成退出,
// 进程假死 18 天而容器持续 Running,Docker 自动重启链路从未触发。
// 显式捕获一切未处理异常并同步强制 exit(1),把恢复交给容器重启策略兜底。
import console from "./console.js";

process.on("uncaughtException", (error) => {
    try {
        console.error("进程遇到未捕获异常,即将退出:", error);
    } catch {
        // 输出管道阻塞时日志可能失败,不应阻止退出(本次事故的疑似机制)
    }
    process.exit(1);
});
process.on("unhandledRejection", (reason) => {
    try {
        console.error("进程遇到未处理的 Promise 拒绝,即将退出:", reason);
    } catch {
        // 同上:日志失败不应阻止退出
    }
    process.exit(1);
});
