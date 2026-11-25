# dnspod-ddns

[dnspod-ddns](https://hub.docker.com/r/annangela/dnspod-ddns) 是一个用于 dnspod 的 ddns 镜像，使用下列环境变量来进行配置：

* 必填：
  * `DNSPOD_ID`: 在 <https://console.dnspod.cn/account/token/token> 创建的 API 密钥的 ID；
  * `DNSPOD_TOKEN`: 在 <https://console.dnspod.cn/account/token/token> 创建的 API 密钥的 Token；
  * `DNSPOD_DOMAIN`: 你的域名（注意为 <https://console.dnspod.cn/dns/list> 列举的一级域名）。
* 选填：
  * `DNSPOD_SUB_DOMAIN`: 你的主机记录名（在域名的“记录管理”里的“主机记录”一列），默认为 `@`；
  * `DNSPOD_RECORD_LINE_NAMES`: 限制更新的线路，为用 `|` 分隔的一串线路名、线路 ID，默认为空，**例如** `默认|华南|10=2`；
  * `NETWORK_INTERFACE_NAME`: 你的网卡名，默认为 `eth0`（如果在 Synology NAS 上使用，建议设置为 `ovs_eth0`）；
  * `CRON`: 任务定时运行的六列 cron 表达式，默认为 `0 */5 * * * *`；
  * `TZ`: 时区（如 `Asia/Shanghai`），影响 cron 调度与日志时间戳，默认 `UTC`。

**注意：请务必设置网络模式为宿主模式！** 如果通过命令行等形式，请设置 `--net=host`，如果在 Synology NAS 上使用，请在向导的网络部分设置“使用与 Docker Host 相同的网络”。

## 健康检查与自动重启

镜像内置了 Docker HEALTHCHECK（每 5 分钟一次）：应用每次执行任务时写入心跳文件，健康检查脚本根据心跳新鲜度判定容器健康状态（容忍连续错过 3 个调度周期，再加 10 分钟缓冲）。即使出现进程假死（容器显示运行中、但应用已停止工作），容器也会转为 `unhealthy` 状态，可在 DSM Container Manager 或 `docker ps` 中看到，建议配合监控告警。

同时请务必为容器配置自动重启（DSM 向导中的“自动重启”，或命令行的 `--restart=always` / `--restart=on-failure`）：应用遇到无法恢复的错误时会主动退出进程，由 Docker 重启策略兜底恢复。

注意：健康检查只能保证“进程存活且定时任务在触发”，无法发现 DNSPod 侧更新失败（如 API 密钥过期、记录被误删）。对可用性要求高的场景，建议另行监控 DNSPod 记录的 `updated_on` 是否新鲜。

## 升级

升级需重新拉取镜像并重建容器（`docker pull annangela/dnspod-ddns:latest` 后删除并重建容器），仅重启容器不会更新镜像。
