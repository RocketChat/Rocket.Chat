import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';

export enum INpsStatus {
	NEW = 'new',
	IN_PROGRESS = 'in-progress',
	SENDING = 'sending',
	SENT = 'sent',
}

export interface INps extends IRocketChatRecord {
	startAt: Date; // start date a banner should be presented
	expireAt: Date; // date when banner should not be shown anymore
	createdBy: Pick<IUser, '_id' | 'username'>;
	createdAt: Date;
	status: INpsStatus;
}

export enum INpsVoteStatus {
	NEW = 'new',
	SENDING = 'sending',
	SENT = 'sent',
}

export interface INpsVote extends IRocketChatRecord {
	_id: string;
	npsId: INps['_id'];
	ts: Date;
	identifier: string; // voter identifier
	roles: IUser['roles']; // voter roles
	score: number;
	comment: string;
	status: INpsVoteStatus;
}
