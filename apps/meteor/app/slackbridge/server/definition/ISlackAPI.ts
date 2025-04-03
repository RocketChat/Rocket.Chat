import type {
	ConversationsListResponse,
	ConversationsInfoResponse,
	ConversationsMembersResponse,
	ChatPostMessageArguments,
	ChatPostMessageResponse,
	ChatUpdateArguments,
	UsersInfoResponse,
	ReactionsAddArguments,
	ReactionsRemoveArguments,
	ChatDeleteArguments,
	ConversationsHistoryArguments,
	ConversationsHistoryResponse,
	PinsListResponse,
} from '@slack/web-api';

export type SlackConversation = {
	id: string;
	name: string;
	is_channel: boolean;
	is_group: boolean;
	is_im: boolean;
	is_mpim: boolean;
	is_private: boolean;
	created: number;
	is_archived: boolean;
	is_general: boolean;
	unlinked: number;
	name_normalized: string;
	is_shared: boolean;
	is_frozen: boolean;
	is_org_shared: boolean;
	is_pending_ext_shared: boolean;
	pending_shared: unknown[];
	context_team_id: string;
	updated: Date;
	parent_conversation: unknown | null;
	creator: string;
	is_ext_shared: boolean;
	shared_team_ids: string[];
	is_member: boolean;
	topic: {
		value: string;
		creator: string;
		last_set: number;
	};
	purpose: {
		value: string;
		creator: string;
		last_set: number;
	};
	properties: {
		posting_restricted_to: {
			type: string[];
		};
		threads_restricted_to: {
			type: string[];
		};
		tabs: {
			id: 'string';
			label: string;
			type: string;
		}[];
	};
	previous_names: string[];
};

export type SlackUser = {
	id: string;
	team_id: string;
	name: string;
	deleted: boolean;
	color: string;
	real_name: string;
	tz: string;
	tz_label: string;
	tz_offset: number;
	profile: Record<string, any>;
	is_admin: boolean;
	is_owner: boolean;
	is_primary_owner: boolean;
	is_restricted: boolean;
	is_ultra_restricted: boolean;
	is_bot: boolean;
	is_app_user: boolean;
	updated: number;
	is_email_confirmed: boolean;
	who_can_share_contact_card: string;
	enterprise_user: Record<string, any>;
};

export type SlackPostMessage = ChatPostMessageArguments & {
	username?: string;
};

export interface ISlackAPI {
	getChannels(cursor?: string | null): Promise<Required<ConversationsListResponse>['channels']>;
	getGroups(cursor?: string | null): Promise<Required<ConversationsListResponse>['channels']>;
	getRoomInfo(roomId: string): Promise<ConversationsInfoResponse['channel']>;
	getMembers(channelId: string): Promise<ConversationsMembersResponse['members']>;
	react(data: ReactionsAddArguments): Promise<boolean>;
	removeReaction(data: ReactionsRemoveArguments): Promise<boolean>;
	removeMessage(data: ChatDeleteArguments): Promise<boolean>;
	sendMessage(data: ChatPostMessageArguments): Promise<ChatPostMessageResponse>;
	updateMessage(data: ChatUpdateArguments): Promise<boolean>;
	getHistory(options: ConversationsHistoryArguments): Promise<ConversationsHistoryResponse>;
	getPins(channelId: string): Promise<PinsListResponse['items'] | undefined>;
	getUser(userId: string): Promise<UsersInfoResponse['user'] | undefined>;
	getFile(fileUrl: string): Promise<Buffer<ArrayBufferLike> | undefined>;
}
