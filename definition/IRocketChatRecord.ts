export interface IRocketChatRecord {
	_id: string;
	_updatedAt: Date;
}

export type RocketChatRecordDeleted<T> = T &
	IRocketChatRecord & {
		_deletedAt: Date;
		__collection__: string;
	};
