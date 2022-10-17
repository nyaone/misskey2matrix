import axios, {AxiosRequestConfig} from "axios";

import config from "./config.js";

export interface U {
    username: string,
    displayname: string,
    avatarUrl: string,
}

const axiosConfig: AxiosRequestConfig = {
    baseURL: config.synapse.url,
    headers: {
        'Authorization': `Bearer ${config.synapse.token}`,
    },
};

const helpHandler = async (iName: string) => {
    return (
        `${iName} 使用帮助\n` +
        "  指令  - 说明\n" +
        "--------------------------\n" +
        "  帮助  - 打印此条帮助信息\n" +
        "注册账户 - 为您注册一个 Matrix 关联账户。一名用户仅可拥有一个账户。\n" +
        "重置密码 - 重置您 Matrix 关联账户的密码。"
    );
}

const randPassword = (passlen: number = 24): string => {
    const validRange = [
        [48, 57],
        [65, 90],
        [97, 122],
    ];
    let pass = [];
    for (let i = 0; i < passlen; i++) {
        const rangePart = Math.floor(Math.random() * validRange.length);
        const charCode = Math.floor(Math.random() * (
            validRange[rangePart][1] - validRange[rangePart][0]
        ) + validRange[rangePart][0]);
        pass.push(String.fromCharCode(charCode));
    }
    return pass.join('');
}

const checkIfExist = async (user: U): Promise<boolean> => {
    const username = user.username;
    try {
        const res = await axios.get(
            `/_synapse/admin/v2/users/@${username}:${config.synapse.host}`,
            axiosConfig,
        );
        return res.status === 200;
    } catch (e) {
        // ignore
    }
    return false;
}

const registerHandler = async (user: U) => {
    const username = user.username;
    const password = randPassword();
    let isError = false;
    let errReason = '';
    if (await checkIfExist(user)) {
        isError = true;
        errReason = '账号已存在';
    } else {
        try {
            const res = await axios.put(`/_synapse/admin/v2/users/@${username}:${config.synapse.host}`, {
                password: password,
                displayname: user.displayname,
                avatar_url: user.avatarUrl,
                threepids: [],
                external_ids: [],
                admin: false,
                deactivated: false,
            }, axiosConfig);
            if (res.status === 201 || res.status === 200) {
                isError = false;
            }
        } catch (e) {
            isError = true;
            errReason = <string>e;
        }
    }
    return !isError ?
        `注册成功，您的账户为 \`${username}\` ，您的密码为 \`${password}\` ，您可以访问 ${config.synapse.web_client} 登录使用。预祝您使用愉快！`
        :
        `很抱歉，您注册失败。错误原因： ${errReason} 。如有任何疑问，您可以联系实例管理员。很抱歉给您带来的不便。`;
}

const resetPasswordHandler = async (user: U) => {
    const username = user.username;
    const password = randPassword();
    let isError = false;
    let errReason = '';
    if (!(await checkIfExist(user))) {
        isError = true;
        errReason = '账号不存在';
    } else {
        try {
            const res = await axios.post(`/_synapse/admin/v1/reset_password/@${username}:${config.synapse.host}`, {
                new_password: password,
                logout_devices: false,
            }, axiosConfig);
            if (res.status === 201 || res.status === 200) {
                isError = false;
            }
        } catch (e) {
            isError = true;
            errReason = <string>e;
        }
    }
    return !isError ?
        `密码重置成功。您的新密码为： \`${password}\` 。您可在客户端检查您已登录的设备。`
        :
        `很抱歉，无法为您重置密码。错误原因： ${errReason} 。如有任何疑问，您可以联系实例管理员。很抱歉给您带来的不便。`;
}

export const commandHandler = async (text: string, user: U, iName: string): Promise<string> => {
    if (text === "注册" || text === "注册账户" || text === "reg" || text === "register") {
        return (await registerHandler(user));
    } else if (text === "重置" || text === "重置密码" || text === "reset") {
        return (await resetPasswordHandler(user));
    } else {
        return (await helpHandler(iName));
    }
}

export default commandHandler;
