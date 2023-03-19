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
  * `CRON`: 任务定时运行的六列 cron 表达式，默认为 `0 */5 * * * *`。

**注意：请务必设置网络模式为宿主模式！**如果通过命令行等形式，请设置 `--net=host`，如果在 Synology NAS 上使用，请在向导的网络部分设置“使用与 Docker Host 相同的网络”。
