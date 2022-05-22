import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IIntegrationHistory extends IRocketChatRecord {
	type: string;
	step: string;
	integration: {
		_id: string;
	};
	event: string;
	_createdAt: Date;
	_updatedAt: Date;
	data?: {
		user?: any;
		room?: any;
	};
	ranPrepareScript: boolean;
	finished: boolean;

	triggerWord?: string;
	prepareSentMessage?: string;
	processSentMessage?: string;
	url?: string;
	httpCallData?: string;
	httpError?: any;
	httpResult?: string;
	error?: any;
	errorStack?: any;
}
