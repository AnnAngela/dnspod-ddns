import console, { globalConsole } from "./console.js";
console.info("Start initialization...");
import jsonModule from "./jsonModule.js";

const packageLockFile = "package-lock.json";
console.info("Start to read", packageLockFile);
const packageLockFileContent = await jsonModule.readFile(packageLockFile);
console.info("Start to modified resolved path for packages");
for (const key of Object.keys(packageLockFileContent.packages)) {
    if (typeof packageLockFileContent.packages[key].resolved === "string") {
        const url = new URL(packageLockFileContent.packages[key].resolved);
        url.hostname = "registry.npmjs.org";
        url.pathname = url.pathname.replace(/^\/npm/, "");
        packageLockFileContent.packages[key].resolved = `${url}`;
    }
}
console.info("Start to write back", packageLockFile);
await jsonModule.writeFile(packageLockFile, packageLockFileContent);
console.info("Done.");
globalConsole.info("=".repeat(120));
