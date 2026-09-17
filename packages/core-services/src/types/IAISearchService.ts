import type { IRoom } from '@rocket.chat/core-typings';

import type { IServiceClass } from './ServiceClass';

export type AISearchFilters = {
	rid?: string;
	rids?: string[];
	roomNames?: string[];
	fromUsername?: string;
	fromUsernames?: string[];
	startDate?: string | Date;
	endDate?: string | Date;
};

export type AISearchStatus = {
	hasIntelligentSearchLicense: boolean;
	intelligentSearchEnabled: boolean;
	intelligentSearchConfigured: boolean;
	answerGenerationConfigured: boolean;
};

export type AISearchAnswerMessage = {
	text: string;
	username?: string;
	roomName?: string;
	ts?: string;
	score?: number;
};

export type AISearchAnswerResult = {
	answer: string;
	provider: {
		name: string;
		model: string;
	};
};

export type AISearchModelOption = {
	key: string;
	label: string;
};

export type AISearchResult = {
	_id: string;
	rid?: string;
	msgId?: string;
	text: string;
	score?: number;
	ts?: string;
	u?: { username: string; name?: string };
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};

export interface IAISearchService extends IServiceClass {
	status(): Promise<AISearchStatus>;

	search(params: { query: string; userId: string; filters?: AISearchFilters; limit?: number }): Promise<AISearchResult[]>;

	answer(params: { query: string; messages: AISearchAnswerMessage[] }): Promise<AISearchAnswerResult>;

	models(): Promise<AISearchModelOption[]>;
}
