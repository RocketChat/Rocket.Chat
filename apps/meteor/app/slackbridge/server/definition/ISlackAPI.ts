import type { MessageEvent } from '@slack/types';

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

export type SlackPostMessage = {
	// Token is mandatory, but may be passed on the header instead of the params
	token?: string;

	channel: string;
	// JSON serialized array
	attachments?: string;
	// JSON serialized array
	blocks?: string;
	text?: string;

	as_user?: boolean;
	icon_emoji?: string;
	icon_url?: string;
	link_names?: boolean;
	markdown_text?: string;
	metadata?: string;
	mrkdwn?: boolean;
	parse?: string;
	reply_broadcast?: boolean;
	thread_ts?: string;
	unfurl_links?: boolean;
	unfurl_media?: boolean;
	username?: string;
} & ({ attachments: string } | { blocks: string } | { text: string });

export type SlackMessageResponse<SuccessType> =
	| {
			ok: false;
			error: string;
	  }
	| ({
			ok: true;
	  } & SuccessType);

export type SlackPostMessageResponse = SlackMessageResponse<{
	channel: string;
	ts: string;
	message: MessageEvent;
}>;

export type SlackUpdateMessage = Pick<
	SlackPostMessage,
	| 'token'
	| 'channel'
	| 'attachments'
	| 'blocks'
	| 'text'
	| 'as_user'
	| 'link_names'
	| 'markdown_text'
	| 'metadata'
	| 'parse'
	| 'reply_broadcast'
> & {
	ts: string;
	// accepts an array of strings or a CSV
	file_ids?: string[] | string;
} & ({ attachments: string } | { blocks: string } | { text: string });

export type SlackUpdateMessageResponse = SlackMessageResponse<{
	channel: string;
	ts: string;
	text: string;
	message: Partial<MessageEvent>;
}>;

export interface ISlackAPI {
	getRoomInfo(roomId: string): Promise<SlackConversation>;
	getMembers(channelId: string): Promise<string[]>;
	getUser(userId: string): Promise<SlackUser>;
	sendMessage(data: SlackPostMessage): Promise<SlackPostMessageResponse>;
	updateMessage(data: SlackUpdateMessage): Promise<SlackUpdateMessageResponse>;
}
