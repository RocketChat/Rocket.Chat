import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import type {
	ChatPostMessageResponse,
	ConversationsHistoryResponse,
	ConversationsInfoResponse,
	ConversationsListResponse,
	ConversationsMembersResponse,
	UsersInfoResponse,
	WebAPICallResult,
} from '@slack/web-api';

export type SlackChannel = NonNullable<ConversationsListResponse['channels']>[number];

// The SDK's pins.list response type omits the pinned message and its channel
type PinsListResponse = WebAPICallResult & {
	items?: { channel?: string; message?: { user?: string; text?: string; ts?: string } }[];
};

type SlackParams = Record<string, string | number | boolean | undefined>;

export class SlackAPI {
	readonly token: string;

	constructor(apiOrBotToken: string) {
		this.token = apiOrBotToken;
	}

	async getChannels(cursor?: string): Promise<SlackChannel[]> {
		let channels: SlackChannel[] = [];
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
		const response = (await request.json()) as ConversationsListResponse;

		if (response && response && Array.isArray(response.channels) && response.channels.length > 0) {
			channels = channels.concat(response.channels);
			if (response.response_metadata?.next_cursor) {
				const nextChannels = await this.getChannels(response.response_metadata.next_cursor);
				channels = channels.concat(nextChannels);
			}
		}

		return channels;
	}

	async getGroups(cursor?: string): Promise<SlackChannel[]> {
		let groups: SlackChannel[] = [];
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
		const response = (await request.json()) as ConversationsListResponse;

		if (response && response && Array.isArray(response.channels) && response.channels.length > 0) {
			groups = groups.concat(response.channels);
			if (response.response_metadata?.next_cursor) {
				const nextGroups = await this.getGroups(response.response_metadata.next_cursor);
				groups = groups.concat(nextGroups);
			}
		}

		return groups;
	}

	async getRoomInfo(roomId: string) {
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
		const response = (await request.json()) as ConversationsInfoResponse;
		return response && response && request.status === 200 && request.ok && response.channel;
	}

	async getMembers(channelId: string) {
		const { num_members = 0 } = (await this.getRoomInfo(channelId)) || {};
		const MAX_MEMBERS_PER_CALL = 100;
		let members: string[] = [];
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
			const response = (await request.json()) as ConversationsMembersResponse;
			if (response && response && request.status === 200 && request.ok && Array.isArray(response.members)) {
				members = members.concat(response.members);
				const hasMoreItems = response.response_metadata?.next_cursor;
				if (hasMoreItems) {
					currentCursor = hasMoreItems;
				}
			}
		}
		return members;
	}

	async react(data: SlackParams) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/reactions.add', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = (await request.json()) as WebAPICallResult;
		return response && request.status === 200 && response && request.ok;
	}

	async removeReaction(data: SlackParams) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/reactions.remove', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = (await request.json()) as WebAPICallResult;
		return response && request.status === 200 && response && request.ok;
	}

	async removeMessage(data: SlackParams) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/chat.delete', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = (await request.json()) as WebAPICallResult;
		return response && request.status === 200 && response && request.ok;
	}

	async sendMessage(data: SlackParams): Promise<ChatPostMessageResponse> {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/chat.postMessage', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		return request.json() as Promise<ChatPostMessageResponse>;
	}

	async updateMessage(data: SlackParams) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/chat.update', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = (await request.json()) as WebAPICallResult;
		return response && request.status === 200 && response && request.ok;
	}

	async getHistory(options: SlackParams): Promise<ConversationsHistoryResponse> {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch(`https://slack.com/api/conversations.history`, {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: options,
		});
		return request.json() as Promise<ConversationsHistoryResponse>;
	}

	async getPins(channelId: string) {
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
		const response = (await request.json()) as PinsListResponse;
		return response && response && request.status === 200 && request.ok && response.items;
	}

	async getUser(userId: string) {
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
		const response = (await request.json()) as UsersInfoResponse;
		return response && response && request.status === 200 && request.ok && response.user;
	}

	static async verifyToken(token: string) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/auth.test', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${token}`,
			},
			method: 'POST',
		});
		const response = (await request.json()) as WebAPICallResult;
		return response && response && request.status === 200 && request.ok && response.ok;
	}

	static async verifyAppCredentials({ botToken, appToken }: { botToken: string; appToken: string }) {
		// SECURITY: the URL is a default hardcoded value or an envvar/setting set by an admin. It's safe to disable this check.
		const request = await fetch('https://slack.com/api/apps.connections.open', {
			ignoreSsrfValidation: true,
			headers: {
				Authorization: `Bearer ${appToken}`,
			},
			method: 'POST',
		});
		const response = (await request.json()) as WebAPICallResult;
		const isAppTokenOk = response && response && request.status === 200 && request.ok && response.ok;
		const isBotTokenOk = await this.verifyToken(botToken);
		return isAppTokenOk && isBotTokenOk;
	}
}
