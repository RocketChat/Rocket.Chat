import { serverFetch as fetch } from '@rocket.chat/server-fetch';

export class SlackAPI {
	constructor(apiOrBotToken) {
		this.token = apiOrBotToken;
	}

	async getChannels(cursor = null) {
		let channels = [];
		const request = await fetch('https://slack.com/api/conversations.list', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				types: 'public_channel',
				exclude_archived: true,
				limit: 1000,
				...(cursor && { cursor }),
			},
		});
		const response = await request.json();

		if (response && response && Array.isArray(response.channels) && response.channels.length > 0) {
			channels = channels.concat(response.channels);
			if (response.response_metadata && response.response_metadata.next_cursor) {
				const nextChannels = await this.getChannels(response.response_metadata.next_cursor);
				channels = channels.concat(nextChannels);
			}
		}

		return channels;
	}

	async getGroups(cursor = null) {
		let groups = [];
		const request = await fetch('https://slack.com/api/conversations.list', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				types: 'private_channel',
				exclude_archived: true,
				limit: 1000,
				...(cursor && { cursor }),
			},
		});
		const response = await request.json();

		if (response && response && Array.isArray(response.channels) && response.channels.length > 0) {
			groups = groups.concat(response.channels);
			if (response.response_metadata && response.response_metadata.next_cursor) {
				const nextGroups = await this.getGroups(response.response_metadata.next_cursor);
				groups = groups.concat(nextGroups);
			}
		}

		return groups;
	}

	async getRoomInfo(roomId) {
		const request = await fetch(`https://slack.com/api/conversations.info`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				channel: roomId,
				include_num_members: true,
			},
		});
		const response = await request.json();
		return response && response && request.status === 200 && request.ok && response.channel;
	}

	async getMembers(channelId) {
		const { num_members } = this.getRoomInfo(channelId);
		const MAX_MEMBERS_PER_CALL = 100;
		let members = [];
		let currentCursor = '';
		for (let index = 0; index < num_members; index += MAX_MEMBERS_PER_CALL) {
			// eslint-disable-next-line no-await-in-loop
			const request = await fetch('https://slack.com/api/conversations.members', {
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
				params: {
					channel: channelId,
					limit: MAX_MEMBERS_PER_CALL,
					...(currentCursor && { cursor: currentCursor }),
				},
			});
			// eslint-disable-next-line no-await-in-loop
			const response = await request.json();
			if (response && response && request.status === 200 && request.ok && Array.isArray(response.members)) {
				members = members.concat(response.members);
				const hasMoreItems = response.response_metadata && response.response_metadata.next_cursor;
				if (hasMoreItems) {
					currentCursor = response.response_metadata.next_cursor;
				}
			}
		}
		return members;
	}

	async react(data) {
		const request = await fetch('https://slack.com/api/reactions.add', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && response && request.ok;
	}

	async removeReaction(data) {
		const request = await fetch('https://slack.com/api/reactions.remove', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && response && request.ok;
	}

	async removeMessage(data) {
		const request = await fetch('https://slack.com/api/chat.delete', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && response && request.ok;
	}

	async sendMessage(data) {
		const request = await fetch('https://slack.com/api/chat.postMessage', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		return request.json();
	}

	async updateMessage(data) {
		const request = await fetch('https://slack.com/api/chat.update', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && response && request.ok;
	}

	async getHistory(options) {
		const request = await fetch(`https://slack.com/api/conversations.history`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: options,
		});
		const response = await request.json();
		return response;
	}

	async getPins(channelId) {
		const request = await fetch('https://slack.com/api/pins.list', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				channel: channelId,
			},
		});
		const response = await request.json();
		return response && response && request.status === 200 && request.ok && response.items;
	}

	async getUser(userId) {
		const request = await fetch('https://slack.com/api/users.info', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				user: userId,
			},
		});
		const response = await request.json();
		return response && response && request.status === 200 && request.ok && response.user;
	}

	static async verifyToken(token) {
		const request = await fetch('https://slack.com/api/auth.test', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			method: 'POST',
		});
		const response = await request.json();
		return response && response && request.status === 200 && request.ok && response.ok;
	}

	static async verifyAppCredentials({ botToken, appToken }) {
		const request = await fetch('https://slack.com/api/apps.connections.open', {
			headers: {
				Authorization: `Bearer ${appToken}`,
			},
			method: 'POST',
		});
		const response = await request.json();
		const isAppTokenOk = response && response && request.status === 200 && request.ok && response.ok;
		const isBotTokenOk = await this.verifyToken(botToken);
		return isAppTokenOk && isBotTokenOk;
	}
}
