import { HTTP } from 'meteor/http';

export class SlackAPI {

	constructor(apiToken) {
		this.apiToken = apiToken;
	}

	getChannels() {
		const response = HTTP.get('https://slack.com/api/conversations.list', {
			params: {
				token: this.apiToken,
				types: 'public_channel',
			},
		});
		return response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0
			? response.data.channels
			: [];
	}

	getGroups() {
		const response = HTTP.get('https://slack.com/api/conversations.list', {
			params: {
				token: this.apiToken,
				types: 'private_channel',
			},
		});
		return response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0
			? response.data.channels
			: [];
	}

	getRoomInfo(roomId) {
		const response = HTTP.get('https://slack.com/api/conversations.info', {
			params: {
				token: this.apiToken,
				channel: roomId,
			},
		});
		return response && response.data && response.statusCode === 200 && response.data.ok && response.data.channel;
	}

	getMembers(channelId) {
		const response = HTTP.get('https://slack.com/api/conversations.members', {
			params: {
				token: this.apiToken,
				channel: channelId,
			},
		});
		return response && response.data && response.statusCode === 200 && response.data.ok && response.data.members;
	}

	react(data) {
		const response = HTTP.post('https://slack.com/api/reactions.add', { params: data });
		return response && response.statusCode === 200 && response.data && response.data.ok;
	}

	removeReaction(data) {
		const response = HTTP.post('https://slack.com/api/reactions.remove', { params: data });
		return response && response.statusCode === 200 && response.data && response.data.ok;
	}

	removeMessage(data) {
		const response = HTTP.post('https://slack.com/api/chat.delete', { params: data });
		return response && response.statusCode === 200 && response.data && response.data.ok;
	}

	sendMessage(data) {
		return HTTP.post('https://slack.com/api/chat.postMessage', { params: data });
	}

	updateMessage(data) {
		const response = HTTP.post('https://slack.com/api/chat.update', { params: data });
		return response && response.statusCode === 200 && response.data && response.data.ok;
	}

	getHistory(family, options) {
		const response = HTTP.get(`https://slack.com/api/${ family }.history`, { params: Object.assign({ token: this.apiToken }, options) });
		return response && response.data;
	}

	getPins(channelId) {
		const response = HTTP.get('https://slack.com/api/pins.list', {
			params: {
				token: this.apiToken,
				channel: channelId,
			},
		});
		return response && response.data && response.statusCode === 200 && response.data.ok && response.data.items;
	}

	getUser(userId) {
		const response = HTTP.get('https://slack.com/api/users.info', {
			params: {
				token: this.apiToken,
				user: userId,
			},
		});
		return response && response.data && response.statusCode === 200 && response.data.ok && response.data.user;
	}

}
