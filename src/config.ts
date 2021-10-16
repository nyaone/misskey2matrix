export default {
    misskey: {
        url: process.env.MISSKEY_URL || 'https://misskey.test',
        token: process.env.MISSKEY_TOKEN || '',
    },
    synapse: {
        url: process.env.SYNAPSE_URL || 'https://synapse.test',
        token: process.env.SYNAPSE_TOKEN || '',
    },
}
