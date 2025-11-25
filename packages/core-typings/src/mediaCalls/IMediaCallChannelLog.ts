import type { IRocketChatRecord } from '../IRocketChatRecord';

export interface IMediaCallChannelLog extends IRocketChatRecord {
	callId: string;

	channelId: string;

	direction: 'send' | 'recv';

	ts: Date;

	content: Record<string, any>;
}
