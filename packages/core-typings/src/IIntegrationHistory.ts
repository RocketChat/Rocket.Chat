import type { OutgoingIntegrationEvent } from './IIntegration.js';
import type { IMessage } from './IMessage/index.js';
import type { IRocketChatRecord } from './IRocketChatRecord.js';

export interface IIntegrationHistory extends IRocketChatRecord {
	type: string;
	step: string;
	integration: {
		_id: string;
	};
	event: OutgoingIntegrationEvent;
	_createdAt: Date;
	data?: {
		user?: any;
		room?: any;
		owner?: any;
		message_id?: string;
		channel_id?: string;
		user_id?: string;
	};
	ranPrepareScript: boolean;
	finished: boolean;

	triggerWord?: string;
	prepareSentMessage?: { channel: string; message: Partial<IMessage> }[];
	processSentMessage?: { channel: string; message: Partial<IMessage> }[];
	url?: string;
	httpCallData?: Record<string, any>;
	httpError?: any;
	httpResult?: string;
	error?: any;
	errorStack?: any;
}
