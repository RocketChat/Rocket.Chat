import type { FindCursor, DeleteResult, UpdateResult, Document } from 'mongodb';
import type { ReadReceipt, IUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IReadReceiptsModel extends IBaseModel<ReadReceipt> {
	findByMessageId(messageId: string): FindCursor<ReadReceipt>;
	removeByUserId(userId: string): Promise<DeleteResult>;
	removeByRoomId(roomId: string): Promise<DeleteResult>;
	removeByRoomIds(roomIds: string[]): Promise<DeleteResult>;
	removeByMessageId(messageId: string): Promise<DeleteResult>;
	removeByMessageIds(messageIds: string[]): Promise<DeleteResult>;
	removeByRoomIdAndTypesUntilDate(roomId: string, types: string[], until: Date): Promise<DeleteResult>;
	removeByIdPinnedTimestampLimitAndUsers(
		roomId: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Date,
		users: IUser['username'][],
		ignoreThreads: boolean,
	): Promise<DeleteResult>;
	setPinnedByMessageId(messageId: string, pinned: boolean): Promise<Document | UpdateResult>;
}
