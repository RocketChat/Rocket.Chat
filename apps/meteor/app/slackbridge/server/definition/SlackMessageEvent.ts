import type {
	GenericMessageEvent,
	BotMessageEvent,
	ChannelArchiveMessageEvent,
	ChannelJoinMessageEvent,
	ChannelLeaveMessageEvent,
	ChannelNameMessageEvent,
	ChannelPostingPermissionsMessageEvent,
	ChannelPurposeMessageEvent,
	ChannelTopicMessageEvent,
	ChannelUnarchiveMessageEvent,
	EKMAccessDeniedMessageEvent,
	FileShareMessageEvent,
	MeMessageEvent,
	MessageChangedEvent,
	MessageDeletedEvent,
	MessageRepliedEvent,
	ThreadBroadcastMessageEvent,
	MessageAttachment,
} from '@slack/types';

export type SlackMessageEvent =
	| GenericMessageEvent
	| BotMessageEvent
	| ChannelArchiveMessageEvent
	| ChannelJoinMessageEvent
	| ChannelLeaveMessageEvent
	| ChannelNameMessageEvent
	| ChannelPostingPermissionsMessageEvent
	| ChannelPurposeMessageEvent
	| ChannelTopicMessageEvent
	| ChannelUnarchiveMessageEvent
	| EKMAccessDeniedMessageEvent
	| FileShareMessageEvent
	| MeMessageEvent
	| MessageChangedEvent
	| MessageDeletedEvent
	| MessageRepliedEvent
	| ThreadBroadcastMessageEvent
	| GroupJoinMessageEvent
	| GroupLeaveMessageEvent
	| GroupTopicMessageEvent
	| GroupPurposeMessageEvent
	| GroupNameMessageEvent
	| GroupArchiveMessageEvent
	| GroupUnarchiveMessageEvent
	| FileCommentMessageEvent
	| FileMentionMessageEvent
	| PinnedItemMessageEvent
	| UnpinnedItemMessageEvent;

// group_join messages are only emmited by the RTM API
export type GroupJoinMessageEvent = Omit<ChannelJoinMessageEvent, 'subtype'> & {
	subtype: 'group_join';
};

// group_leave messages are only emmited by the RTM API
export type GroupLeaveMessageEvent = Omit<ChannelLeaveMessageEvent, 'subtype'> & {
	subtype: 'group_leave';
};

// group_topic messages are only emmited by the RTM API
export type GroupTopicMessageEvent = Omit<ChannelTopicMessageEvent, 'subtype'> & {
	subtype: 'group_topic';
};

// group_purpose messages are only emmited by the RTM API
export type GroupPurposeMessageEvent = Omit<ChannelPurposeMessageEvent, 'subtype'> & {
	subtype: 'group_purpose';
};

// group_name messages are only emmited by the RTM API
export type GroupNameMessageEvent = Omit<ChannelNameMessageEvent, 'subtype'> & {
	subtype: 'group_name';
};

// group_archive messages are only emmited by the RTM API
export type GroupArchiveMessageEvent = Omit<ChannelArchiveMessageEvent, 'subtype'> & {
	subtype: 'group_archive';
};

// group_unarchive messages are only emmited by the RTM API
export type GroupUnarchiveMessageEvent = Omit<ChannelUnarchiveMessageEvent, 'subtype'> & {
	subtype: 'group_unarchive';
};

// file_comment messages are only emmited by the RTM API
export type FileCommentMessageEvent = {
	type: 'message';
	subtype: 'file_comment';
	ts: string;
	text: string;
	file: unknown;
	comment: unknown;
};

export type FileMentionMessageEvent = {
	type: 'message';
	subtype: 'file_mention';
	ts: string;
	text: string;
	file: unknown;
	user: string;
};

export type PinnedItemMessageEvent = {
	type: 'message';
	subtype: 'pinned_item';
	user: string;
	item_type: 'C' | 'G' | 'F' | 'Fc';
	text: string;
	item: unknown;
	channel: string;
	ts: string;

	// According to Slack documentation, there is no such attribute here, but it is what our legacy code expects
	attachments?: MessageAttachment[];
};

export type UnpinnedItemMessageEvent = Omit<PinnedItemMessageEvent, 'subtype'> & {
	subtype: 'unpinned_item';
};
