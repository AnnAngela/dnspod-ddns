import console, { globalConsole } from "./modules/console.js";
console.info("Start initialization...");
import { networkInterfaces } from "os";
import { CronJob, sendAt, CronTime } from "cron";
import { ISO } from "./modules/toLocalTimeZoneStrings.js";
import apiRequest from "./modules/dnspod-api.js";
const record_types = {
    IPv4: "A",
    IPv6: "AAAA",
};
const separate = (separator) => console.info(separator.repeat(37));
const bigBreak = (emptyBreak = false) => {
    separate("=");
    if (emptyBreak) {
        globalConsole.info("");
    }
};
const middleBreak = () => separate("-");
const smallBreak = () => separate("*");

bigBreak();
const { DNSPOD_ID, DNSPOD_TOKEN, DNSPOD_DOMAIN } = process.env;
const { NETWORK_INTERFACE_NAME, CRON, DNSPOD_SUB_DOMAIN, DNSPOD_RECORD_LINE_NAMES } = process.env;
const id = DNSPOD_ID.trim();
const token = DNSPOD_TOKEN.trim();
const domain = DNSPOD_DOMAIN.trim();
const sub_domain = DNSPOD_SUB_DOMAIN?.trim() || "@";
if (!id || !token) {
    console.error("未填写 DNSPOD_ID 或 DNSPOD_TOKEN 环境变量！");
    process.exit(1);
}
const login_token = `${id},${token}`;
if (!domain || !sub_domain) {
    console.error("未填写 DNSPOD_DOMAIN 或 DNSPOD_SUB_DOMAIN 环境变量！");
    process.exit(1);
}
try {
    let hostname = DNSPOD_DOMAIN.trim();
    if (sub_domain !== "@") {
        hostname = `${sub_domain}.${hostname}`;
    }
    const url = new URL("http://localhost");
    url.hostname = hostname;
    if (url.hostname !== hostname) {
        console.error("DNSPOD_DOMAIN 或 DNSPOD_SUB_DOMAIN 环境变量无法正确解析，请检查:");
        console.error("\tDNSPOD_DOMAIN:", domain);
        console.error("\tDNSPOD_SUB_DOMAIN:", sub_domain);
        console.error("\t期待结果:", hostname);
        console.error("\t解析结果:", url.hostname);
        process.exit(1);
    }
} catch (e) {
    console.error("DNSPOD_DOMAIN 或 DNSPOD_SUB_DOMAIN 环境变量错误，请检查:", e.message || e);
    process.exit(1);
}
const cronTime = CRON?.trim() || "0 */5 * * * *";
try {
    sendAt(cronTime);
} catch (e) {
    console.error("CRON 环境变量错误，请检查:", e.message || e);
    process.exit(1);
}
const cronTimeObject = new CronTime(cronTime);
const networkInterfaceName = NETWORK_INTERFACE_NAME?.trim() || "eth0";
const recordLines = DNSPOD_RECORD_LINE_NAMES?.trim().split("|") || [];
console.info("解析后的配置项:");
console.info("\tDNSPOD_ID:", id);
console.info("\tDNSPOD_TOKEN:", token.replace(/^(.{0,3}).*?(.{0,3})$/, "$1***$2"));
console.info("\t域名:", domain);
console.info("\t子域名（记录名）:", sub_domain);
console.info("\t网卡名:", networkInterfaceName);
console.info("\tcron 表达式:", cronTime);
console.info("\t线路清单（若无则为空）:", recordLines);
bigBreak(true);

CronJob.from({
    start: true,
    runOnInit: true,
    cronTime,
    onTick: async () => {
        const networkInterfacesObject = networkInterfaces();
        const { [networkInterfaceName]: networkInterface } = networkInterfacesObject;

        if (!Array.isArray(networkInterface) || networkInterface.length === 0) {
            let hasOutput = false;
            for (const [k, v] of Object.entries(networkInterfacesObject)) {
                if (k === "lo" || !Array.isArray(v)) {
                    continue;
                }
                if (!hasOutput) {
                    hasOutput = true;
                    bigBreak();
                } else {
                    middleBreak();
                }
                console.info("网卡名:", k);
                console.info("IP 地址:");
                for (let i = 0; i < v.length; i++) {
                    console.info(`\t${i + 1}.`, `${v[i].family}:`, v[i].address);
                }
            }
            if (hasOutput) {
                bigBreak();
                console.error("无法获取 IP 地址，请检查上面输出的网卡情况，选择合适的网卡名填入 NETWORK_INTERFACE_NAME 环境变量中！");
            } else {
                console.error("无法找到合法的网卡，请检查你的网卡设备！");
            }
            process.exit(1);
        }

        bigBreak();
        console.info("开始登录……");
        const userDetailResponse = await apiRequest({
            action: "User.Detail",
            login_token,
            data: {},
        });
        const userDetail = await userDetailResponse.json();
        if (userDetail.status.code !== "1") {
            console.error("DNSPod 登录失败！请检查返回信息:", userDetail);
            process.exit(1);
        }
        console.info("DNSPOD_ID、DNSPOD_TOKEN 验证成功:", userDetail.info);
        bigBreak();
        console.info("开始获取记录列表……");
        const recordListResponst = await apiRequest({
            action: "Record.List",
            login_token,
            data: {
                domain,
                length: 3000,
                sub_domain,
            },
        });
        const recordList = await recordListResponst.json();
        if (recordList.status.code !== "1") {
            console.error("获取记录列表失败！请检查返回信息:", recordList);
            bigBreak(true);
            return;
        }
        if (recordList.records.length === 0) {
            console.info("没有找到任何记录，退出！");
            bigBreak(true);
            return;
        }
        console.info("获取记录列表成功，开始处理:");
        const records = {};
        for (let i = 0; i < recordList.records.length; i++) {
            middleBreak();
            const { id, line, line_id, type, name, value, weight } = recordList.records[i];
            console.info(`处理记录 #${i}:`);
            console.info("\t记录 ID:", id);
            console.info("\t记录名:", name);
            console.info("\t类型:", type);
            console.info("\tIP 地址:", value);
            console.info("\t线路名:", line);
            console.info("\t线路 ID:", line_id);
            console.info("\t权重:", weight);
            if (name !== sub_domain) {
                console.info("记录名与指定的子域名不符，跳过。");
                continue;
            }
            if (recordLines.length > 0 && !recordLines.includes(line) && !recordLines.includes(line_id)) {
                console.info("记录的线路名或线路 ID 不在配置的线路清单中，跳过。");
                continue;
            }
            if (!Array.isArray(records[type])) {
                records[type] = [];
            }
            records[type].push({ id, line_id, ip: value, weight });
            console.info("记录符合要求，记入。");
        }
        bigBreak();
        console.info("开始分析和提交网卡 IP……");
        for (const { family, address } of networkInterface) {
            middleBreak();
            console.info("处理网卡 IP:");
            console.info("\t类型:", family);
            console.info("\tIP:", address);
            const record_type = record_types[family];
            if (!Array.isArray(records[record_type]) || records[record_type].length === 0) {
                console.info("网卡支持", family, "但没有", record_type, "的记录，跳过。");
                continue;
            }
            console.info("开始分析和提交相关记录……");
            for (const { id, line_id, ip, weight } of records[record_type]) {
                smallBreak();
                console.info("处理记录:");
                console.info("\t记录 ID:", id);
                console.info("\t线路 ID:", line_id);
                console.info("\tIP:", ip);
                console.info("\t权重:", weight);
                if (ip === address) {
                    console.info("网卡 IP 与现有记录一致，跳过。");
                    continue;
                }
                const data = {
                    domain,
                    record_id: id,
                    sub_domain,
                    record_type,
                    record_line_id: line_id,
                    value: address,
                    weight,
                };
                console.info("开始提交记录:", data);
                const recordModifyResponse = await apiRequest({
                    action: "Record.Modify",
                    login_token,
                    data,
                });
                const recordModify = await recordModifyResponse.json();
                if (recordModify.status.code !== "1") {
                    console.error("提交记录失败！请检查返回信息:", recordModify);
                } else {
                    console.info("提交记录成功:", recordModify);
                }
            }
        }
        bigBreak();
        console.info("任务结束，下次运行时间为:", ISO(cronTimeObject.sendAt().toJSDate()));
        bigBreak(true);
    },
});
