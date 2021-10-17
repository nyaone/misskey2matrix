import * as Misskey from 'misskey-js';
import fetch from "node-fetch";
import WebSocket from 'ws';

import { MessagingMessage } from "misskey-js/built/entities";
import matrixHandler, { U } from "./matrix.js";

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

    // @ts-ignore
    mainChannel.on('messagingMessage', async (message: MessagingMessage) => {
        if (message.userId !== i.id) {
            // console.log(`[${message.user.name}](@${message.user.username}) sent: ${message.text}`);

            try {
                await cli.request('messaging/messages/read', {
                    messageId: message.id,
                });

                const user: U = {
                    username: message.user.username.toLowerCase(),
                    displayname: message.user.name,
                    avatarUrl: message.user.avatarUrl,
                }
                const res = await matrixHandler(message.text?.replace(/\s/g, '') || '', user);

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
