import { createRequire } from "module";
const require = createRequire(import.meta.url);
let config = require("../config.json");

import { URL } from "url";

interface Config {
    misskey: {
        url: string,
        token: string,
    },
    synapse: {
        url: string,
        token: string,
        host: string,
    }
}

if (!config.synapse.host) {
    config.synapse.host = (new URL(config.synapse.url)).host;
}

export default config as Config;
