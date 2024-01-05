import type { OutgoingIntegrationEvent } from './IIntegration';
import type { IMessage } from './IMessage';
import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IIntegrationHistory extends IRocketChatRecord {
	type: string;
	step: string;
	integration: {
		_id: string;
	};
	event: OutgoingIntegrationEvent;
	_createdAt: Date;
	_updatedAt: Date;
	data?: {
		user?: any;
		room?: any;
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
