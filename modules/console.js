const globalConsole = global.console;
const prefixable = ["log", "warn", "debug", "info", "error"];
import { ISO } from "./toLocalTimeZoneStrings.js";

export default new Proxy(globalConsole, {
    get: (t, p) => prefixable.includes(p) ? t[p].bind(t, `[${ISO()}]`) : t[p],
});
export { globalConsole };
