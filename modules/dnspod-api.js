import fs from "fs";
import fetch from "node-fetch";

const { version } = JSON.parse(await fs.promises.readFile("./package.json", { encoding: "utf-8" }));

/**
 * @param { { action: string, login_token: string, data: Record<string, string | number | boolean> } } 
 */
const apiRequest = ({
    action,
    login_token,
    data,
}) => fetch(`https://dnsapi.cn/${encodeURI(action)}`, {
    method: "POST",
    headers: {
        "content-type": "application/x-www-form-urlencoded",
        "User-Agent": `dnspod-api/${version}`,
    },
    body: new URLSearchParams({
        ...data,
        login_token,
        format: "json",
        lang: "cn",
    }).toString(),
});
export default apiRequest;
