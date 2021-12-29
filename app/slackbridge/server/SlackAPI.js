import { HTTP } from 'meteor/http';

export class SlackAPI {
	constructor(apiToken) {
		this.apiToken = apiToken;
	}

	getChannels(cursor = null) {
		let channels = [];

		const response = HTTP.get('https://slack.com/api/conversations.list', {
			params: {
				token: this.apiToken,
				types: 'public_channel',
				exclude_archived: true,
				limit: 1000,
				cursor,
			},
		});

		if (response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0) {
			channels = channels.concat(response.data.channels);
			if (response.data.response_metadata && response.data.response_metadata.next_cursor) {
				const nextChannels = this.getChannels(response.data.response_metadata.next_cursor);
				channels = channels.concat(nextChannels);
			}
		}

		return channels;
	}

	getGroups(cursor = null) {
		let groups = [];
		const response = HTTP.get('https://slack.com/api/conversations.list', {
			params: {
				token: this.apiToken,
				types: 'private_channel',
				exclude_archived: true,
				limit: 1000,
				cursor,
			},
		});

		if (response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0) {
			groups = groups.concat(response.data.channels);
			if (response.data.response_metadata && response.data.response_metadata.next_cursor) {
				const nextGroups = this.getGroups(response.data.response_metadata.next_cursor);
				groups = groups.concat(nextGroups);
			}
		}

		return groups;
	}

	getRoomInfo(roomId) {
		const response = HTTP.get('https://slack.com/api/conversations.info', {
			params: {
				token: this.apiToken,
				channel: roomId,
				include_num_members: true,
			},
		});
		return response && response.data && response.statusCode === 200 && response.data.ok && response.data.channel;
	}

	getMembers(channelId) {
		const { num_members } = this.getRoomInfo(channelId);
		const MAX_MEMBERS_PER_CALL = 100;
		let members = [];
		let currentCursor = '';
		for (let index = 0; index < num_members; index += MAX_MEMBERS_PER_CALL) {
			const response = HTTP.get('https://slack.com/api/conversations.members', {
				params: {
					token: this.apiToken,
					channel: channelId,
					limit: MAX_MEMBERS_PER_CALL,
					cursor: currentCursor,
				},
			});
			if (response && response.data && response.statusCode === 200 && response.data.ok && Array.isArray(response.data.members)) {
				members = members.concat(response.data.members);
				const hasMoreItems = response.data.response_metadata && response.data.response_metadata.next_cursor;
				if (hasMoreItems) {
					currentCursor = response.data.response_metadata.next_cursor;
				}
			}
		}
		return members;
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
		const response = HTTP.get(`https://slack.com/api/${family}.history`, {
			params: Object.assign({ token: this.apiToken }, options),
		});
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
