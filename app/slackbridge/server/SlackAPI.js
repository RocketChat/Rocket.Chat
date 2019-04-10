import { HTTP } from 'meteor/http';

export class SlackAPI {

    constructor(apiToken) {
        this.apiToken = apiToken;
    }

    getChannels() {
        const response = HTTP.get('https://slack.com/api/conversations.list', { params: { token: this.apiToken, types: 'public_channel' } });
        return response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0
            ? response.data.channels
            : [];
    }

    getChannelInfo(channelId) {
        const response = HTTP.get('https://slack.com/api/channels.info', { params: { token: this.apiToken, channel: channelId } });

        return response && response.data && response.data.channel;
    }

    getGroups() {
        const response = HTTP.get('https://slack.com/api/conversations.list', { params: { token: this.apiToken, types: 'private_channel' } });
        return response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0
            ? response.data.channels
            : [];
    }

    getGroupInfo() {

    }

    react(data) {
        const response = HTTP.post('https://slack.com/api/reactions.add', { params: data });
        return response && response.data && response.data.ok;
    }
}