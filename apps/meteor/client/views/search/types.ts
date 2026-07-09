import type { IRoom, IUser } from '@rocket.chat/core-typings';

export type IntelligentResult = {
	_id: string;
	rid?: string;
	msgId?: string;
	text: string;
	score?: number;
	ts?: string;
	u?: Pick<IUser, 'username' | 'name'>;
	room?: Pick<IRoom, '_id' | 't' | 'name' | 'fname'>;
};
