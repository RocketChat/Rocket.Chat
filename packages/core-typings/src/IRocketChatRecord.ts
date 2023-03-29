import type { WithId } from 'mongodb';

export interface IRocketChatRecord {
	_id: string;
	_updatedAt: Date;
}

export type RocketChatRecordDeleted<T> = WithId<T> & {
	_updatedAt: Date;
	_deletedAt: Date;
	__collection__: string;
};
