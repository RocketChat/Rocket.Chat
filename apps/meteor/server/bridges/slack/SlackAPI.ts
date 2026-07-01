// This is a JS File that was renamed to TS so it won't lose its git history when converted to TS
// TODO: Remove the following lint/ts instructions when the file gets properly converted
/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

export class SlackAPI {
	constructor(apiOrBotToken) {
		this.token = apiOrBotToken;
	}

	async getChannels(cursor = null) {
		let channels = [];
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/conversations.list', {
			ignoreSsrfValidation: true,
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
			if (response.response_metadata?.next_cursor) {
				const nextChannels = await this.getChannels(response.response_metadata.next_cursor);
				channels = channels.concat(nextChannels);
			}
		}

		return channels;
	}

	async getGroups(cursor = null) {
		let groups = [];
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/conversations.list', {
			ignoreSsrfValidation: true,
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
			if (response.response_metadata?.next_cursor) {
				const nextGroups = await this.getGroups(response.response_metadata.next_cursor);
				groups = groups.concat(nextGroups);
			}
		}

		return groups;
	}

	async getRoomInfo(roomId) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch(`https://slack.com/api/conversations.info`, {
			ignoreSsrfValidation: true,
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
			const request = await fetch('https://slack.com/api/conversations.members', {
				// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
				ignoreSsrfValidation: true,
				headers: {
					Authorization: `Bearer ${this.token}`,
				},
				params: {
					channel: channelId,
					limit: MAX_MEMBERS_PER_CALL,
					...(currentCursor && { cursor: currentCursor }),
				},
			});
			const response = await request.json();
			if (response && response && request.status === 200 && request.ok && Array.isArray(response.members)) {
				members = members.concat(response.members);
				const hasMoreItems = response.response_metadata?.next_cursor;
				if (hasMoreItems) {
					currentCursor = response.response_metadata.next_cursor;
				}
			}
		}
		return members;
	}

	async react(data) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/reactions.add', {
			ignoreSsrfValidation: true,
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
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/reactions.remove', {
			ignoreSsrfValidation: true,
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
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/chat.delete', {
			ignoreSsrfValidation: true,
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
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/chat.postMessage', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		return request.json();
	}

	async updateMessage(data) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/chat.update', {
			ignoreSsrfValidation: true,
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
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch(`https://slack.com/api/conversations.history`, {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: options,
		});
		const response = await request.json();
		return response;
	}

	async getPins(channelId) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/pins.list', {
			ignoreSsrfValidation: true,
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
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/users.info', {
			ignoreSsrfValidation: true,
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
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/auth.test', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${token}`,
			},
			method: 'POST',
		});
		const response = await request.json();
		return response && response && request.status === 200 && request.ok && response.ok;
	}

	static async verifyAppCredentials({ botToken, appToken }) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/apps.connections.open', {
			ignoreSsrfValidation: true,
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
