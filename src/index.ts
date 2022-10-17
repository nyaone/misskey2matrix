import * as Misskey from 'misskey-js';
import fetch from "node-fetch";
import WebSocket from 'ws';

import { MessagingMessage } from "misskey-js/built/entities";
import { commandHandler as matrixHelper } from "./matrix.js"
import type { U } from "./matrix.js";

import config from "./config.js";

(async ()=>{
    console.log(`System starting...`);

    const cli = new Misskey.api.APIClient({
        origin: config.misskey.url,
        credential: config.misskey.token,
        fetch: fetch,
    });

    const meta = await cli.request('meta', { detail: true });
    console.log(`${meta.name} connected!`);

    const i = await cli.request('i', {}, config.misskey.token);
    console.log(`Identity confirm, I'm ${i.name}.`);

    const iName = i.name;

    const stream = new Misskey.Stream(
        config.misskey.url,
        {
            token: config.misskey.token,
        },
        {
            WebSocket: WebSocket,
        }
    );

    stream.on('_connected_', () => {
        console.log(`Stream connected!`);
    });

    stream.on('_disconnected_', () => {
        console.log('Stream disconnected!');
    });

    console.log('Connecting to Main channel...');

    const mainChannel = stream.useChannel('main');

    mainChannel.on('messagingMessage', async message => {
        if (message.userId !== i.id) {
            // console.log(`[${message.user.name}](@${message.user.username}) sent: ${message.text}`);

            try {
                await cli.request('messaging/messages/read', {
                    messageId: message.id,
                });

                let res = '';

                if (message.user.host) {
                    res = '很抱歉，本服务仅限当前实例用户使用。';
                } else {
                    const user: U = {
                        username: message.user.username.toLowerCase(),
                        displayname: message.user.name,
                        avatarUrl: message.user.avatarUrl,
                    }
                    res = await matrixHelper(message.text?.replace(/\s/g, '') || '', user, iName);
                }

                await cli.request('messaging/messages/create', {
                    userId: message.userId,
                    text: res,
                }, config.misskey.token);


            } catch (e) {
                console.log(e);
            }
        }
    });
})();
