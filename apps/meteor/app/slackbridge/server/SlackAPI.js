import { fetch } from '../../../server/lib/http/fetch';

export class SlackAPI {
	constructor(apiToken) {
		this.apiToken = apiToken;
	}

	async getChannels(cursor = null) {
		let channels = [];
		const queryparams = new URLSearchParams({
			token: this.apiToken,
			types: 'public_channel',
			exclude_archived: true,
			limit: 1000,
			cursor,
		});
		const request = await fetch(`https://slack.com/api/conversations.list?${queryparams.toString()}`);
		const response = await request.json();

		if (response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0) {
			channels = channels.concat(response.data.channels);
			if (response.data.response_metadata && response.data.response_metadata.next_cursor) {
				const nextChannels = await this.getChannels(response.data.response_metadata.next_cursor);
				channels = channels.concat(nextChannels);
			}
		}

		return channels;
	}

	async getGroups(cursor = null) {
		let groups = [];
		const queryparams = new URLSearchParams({
			token: this.apiToken,
			types: 'private_channel',
			exclude_archived: true,
			limit: 1000,
			cursor,
		});
		const request = await fetch(`https://slack.com/api/conversations.list?${queryparams.toString()}`);
		const response = await request.json();

		if (response && response.data && Array.isArray(response.data.channels) && response.data.channels.length > 0) {
			groups = groups.concat(response.data.channels);
			if (response.data.response_metadata && response.data.response_metadata.next_cursor) {
				const nextGroups = await this.getGroups(response.data.response_metadata.next_cursor);
				groups = groups.concat(nextGroups);
			}
		}

		return groups;
	}

	async getRoomInfo(roomId) {
		const queryparams = new URLSearchParams({
			token: this.apiToken,
			channel: roomId,
			include_num_members: true,
		});
		const request = await fetch(`https://slack.com/api/conversations.info?${queryparams.toString()}`);
		const response = await request.json();
		return response && response.data && request.status === 200 && response.data.ok && response.data.channel;
	}

	async getMembers(channelId) {
		const { num_members } = this.getRoomInfo(channelId);
		const MAX_MEMBERS_PER_CALL = 100;
		let members = [];
		let currentCursor = '';
		for (let index = 0; index < num_members; index += MAX_MEMBERS_PER_CALL) {
			const queryparams = new URLSearchParams({
				token: this.apiToken,
				channel: channelId,
				limit: MAX_MEMBERS_PER_CALL,
				cursor: currentCursor,
			});

			// eslint-disable-next-line no-await-in-loop
			const request = await fetch(`https://slack.com/api/conversations.members?${queryparams.toString()}`);
			// eslint-disable-next-line no-await-in-loop
			const response = await request.json();
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

	async react(data) {
		const request = await fetch('https://slack.com/api/reactions.add', { method: 'POST', body: JSON.stringify(data) });
		const response = await request.json();
		return response && request.status === 200 && response.data && response.data.ok;
	}

	async removeReaction(data) {
		const request = await fetch('https://slack.com/api/reactions.remove', { method: 'POST', body: JSON.stringify(data) });
		const response = await request.json();
		return response && request.status === 200 && response.data && response.data.ok;
	}

	async removeMessage(data) {
		const request = await fetch('https://slack.com/api/chat.delete', { method: 'POST', body: JSON.stringify(data) });
		const response = await request.json();
		return response && request.status === 200 && response.data && response.data.ok;
	}

	async sendMessage(data) {
		const request = await fetch('https://slack.com/api/chat.postMessage', { method: 'POST', body: JSON.stringify(data) });
		return request.json();
	}

	async updateMessage(data) {
		const request = await fetch('https://slack.com/api/chat.update', { method: 'POST', body: JSON.stringify(data) });
		const response = await request.json();
		return response && request.status === 200 && response.data && response.data.ok;
	}

	async getHistory(family, options) {
		const queryparams = new URLSearchParams({
			token: this.apiToken,
			...options,
		});
		const request = await fetch(`https://slack.com/api/${family}.history?${queryparams.toString()}`);
		const response = await request.json();
		return response && response.data;
	}

	async getPins(channelId) {
		const queryparams = new URLSearchParams({
			token: this.apiToken,
			channel: channelId,
		});
		const request = await fetch(`https://slack.com/api/pins.list?${queryparams.toString()}`);
		const response = await request.json();
		return response && response.data && request.status === 200 && response.data.ok && response.data.items;
	}

	async getUser(userId) {
		const queryparams = new URLSearchParams({
			token: this.apiToken,
			user: userId,
		});
		const request = await fetch(`https://slack.com/api/users.info?${queryparams.toString()}`);
		const response = await request.json();
		return response && response.data && request.status === 200 && response.data.ok && response.data.user;
	}
}
