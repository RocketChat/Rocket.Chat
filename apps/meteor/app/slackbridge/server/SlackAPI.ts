import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import type {
	ChatDeleteArguments,
	ChatPostMessageArguments,
	ChatPostMessageResponse,
	ChatUpdateArguments,
	ConversationsHistoryArguments,
	ConversationsHistoryResponse,
	ConversationsInfoResponse,
	ConversationsListResponse,
	ConversationsMembersResponse,
	PinsListResponse,
	ReactionsAddArguments,
	ReactionsRemoveArguments,
	UsersInfoResponse,
} from '@slack/web-api';

import type { ISlackAPI } from './definition/ISlackAPI';

export class SlackAPI implements ISlackAPI {
	private token: string;

	constructor(apiOrBotToken: string) {
		this.token = apiOrBotToken;
	}

	async getChannels(cursor: string | null = null): Promise<Required<ConversationsListResponse>['channels']> {
		let channels: ConversationsListResponse['channels'] = [];
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
		const response: ConversationsListResponse = await request.json();

		if (response && Array.isArray(response.channels) && response.channels.length > 0) {
			channels = channels.concat(response.channels);
			if (response.response_metadata?.next_cursor) {
				const nextChannels = await this.getChannels(response.response_metadata.next_cursor);
				channels = channels.concat(nextChannels);
			}
		}

		return channels;
	}

	async getGroups(cursor: string | null = null): Promise<Required<ConversationsListResponse>['channels']> {
		let groups: ConversationsListResponse['channels'] = [];
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
		const response: ConversationsListResponse = await request.json();

		if (response && Array.isArray(response.channels) && response.channels.length > 0) {
			groups = groups.concat(response.channels);
			if (response.response_metadata?.next_cursor) {
				const nextGroups = await this.getGroups(response.response_metadata.next_cursor);
				groups = groups.concat(nextGroups);
			}
		}

		return groups;
	}

	async getRoomInfo(roomId: string): Promise<ConversationsInfoResponse['channel']> {
		const request = await fetch(`https://slack.com/api/conversations.info`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				channel: roomId,
				include_num_members: true,
			},
		});
		const response: ConversationsInfoResponse = await request.json();
		return (response && request.status === 200 && request.ok && response.channel) || undefined;
	}

	async getMembers(channelId: string): Promise<ConversationsMembersResponse['members']> {
		const roomInfo = await this.getRoomInfo(channelId);
		if (!roomInfo?.num_members) {
			return [];
		}

		const { num_members } = roomInfo;
		const MAX_MEMBERS_PER_CALL = 100;
		let members: ConversationsMembersResponse['members'] = [];
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
			if (response && request.status === 200 && request.ok && Array.isArray(response.members)) {
				members = members.concat(response.members);
				const hasMoreItems = response.response_metadata?.next_cursor;
				if (hasMoreItems) {
					currentCursor = response.response_metadata.next_cursor;
				}
			}
		}
		return members;
	}

	async react(data: ReactionsAddArguments): Promise<boolean> {
		const request = await fetch('https://slack.com/api/reactions.add', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && request.ok;
	}

	async removeReaction(data: ReactionsRemoveArguments): Promise<boolean> {
		const request = await fetch('https://slack.com/api/reactions.remove', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && request.ok;
	}

	async removeMessage(data: ChatDeleteArguments): Promise<boolean> {
		const request = await fetch('https://slack.com/api/chat.delete', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && request.ok;
	}

	async sendMessage(data: ChatPostMessageArguments): Promise<ChatPostMessageResponse> {
		const request = await fetch('https://slack.com/api/chat.postMessage', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		return request.json();
	}

	async updateMessage(data: ChatUpdateArguments): Promise<boolean> {
		const request = await fetch('https://slack.com/api/chat.update', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			method: 'POST',
			params: data,
		});
		const response = await request.json();
		return response && request.status === 200 && request.ok;
	}

	async getHistory(options: ConversationsHistoryArguments): Promise<ConversationsHistoryResponse> {
		const request = await fetch(`https://slack.com/api/conversations.history`, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: options,
		});
		const response = await request.json();
		return response;
	}

	async getPins(channelId: string): Promise<PinsListResponse['items'] | undefined> {
		const request = await fetch('https://slack.com/api/pins.list', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				channel: channelId,
			},
		});
		const response = await request.json();
		return (response && request.status === 200 && request.ok && response.items) || undefined;
	}

	async getUser(userId: string): Promise<UsersInfoResponse['user'] | undefined> {
		const request = await fetch('https://slack.com/api/users.info', {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
			params: {
				user: userId,
			},
		});
		const response = await request.json();
		return (response && request.status === 200 && request.ok && response.user) || undefined;
	}

	async getFile(fileUrl: string): Promise<Buffer<ArrayBufferLike> | undefined> {
		const request = await fetch(fileUrl, {
			headers: {
				Authorization: `Bearer ${this.token}`,
			},
		});

		// #ToDo: Confirm this works the same way as the old https.get code
		const fileBuffer = await request.buffer();
		if (request.status !== 200 || !request.ok) {
			return undefined;
		}
		return fileBuffer;
	}

	static async verifyToken(token: string): Promise<boolean> {
		const request = await fetch('https://slack.com/api/auth.test', {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			method: 'POST',
		});
		const response = await request.json();
		return response && request.status === 200 && request.ok && response.ok;
	}

	static async verifyAppCredentials({ botToken, appToken }: { botToken: string; appToken: string }): Promise<boolean> {
		const request = await fetch('https://slack.com/api/apps.connections.open', {
			headers: {
				Authorization: `Bearer ${appToken}`,
			},
			method: 'POST',
		});
		const response = await request.json();
		const isAppTokenOk = response && request.status === 200 && request.ok && response.ok;
		const isBotTokenOk = await this.verifyToken(botToken);
		return isAppTokenOk && isBotTokenOk;
	}
}
