import type { IRocketChatRecord } from './IRocketChatRecord';

interface IAnalyticsBase extends IRocketChatRecord {
	type: 'messages' | 'users' | 'seat-request';
	date: number;
}

interface IAnalyticsMessages extends IAnalyticsBase {
	type: 'messages';
	room: {
		_id: string;
		name?: string;
		t: string;
		usernames: string[];
	};
}

interface IAnalyticsUsers extends IAnalyticsBase {
	type: 'users';
}

export interface IAnalyticsSeatRequest extends IAnalyticsBase {
	type: 'seat-request';
	count: number;
}

export type IAnalytics = IAnalyticsMessages | IAnalyticsUsers | IAnalyticsSeatRequest;
