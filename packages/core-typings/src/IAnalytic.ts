import type { IRocketChatRecord } from './IRocketChatRecord';

interface IAnalyticsBase extends IRocketChatRecord {
	type: 'messages' | 'users' | 'seat-request';
	date: number;
}

export interface IAnalyticsMessages extends IAnalyticsBase {
	type: 'messages';
	room: {
		_id: string;
		name?: string;
		t: string;
		usernames: string[];
	};
}

export interface IAnalyticsUsers extends IAnalyticsBase {
	type: 'users';
	room: {
		_id: string;
		name?: string;
		t: string;
		usernames: string[];
	};
}

export interface IAnalyticsSeatRequest extends IAnalyticsBase {
	type: 'seat-request';
	count: number;
}

export type IAnalytic = IAnalyticsBase | IAnalyticsMessages | IAnalyticsUsers | IAnalyticsSeatRequest;
