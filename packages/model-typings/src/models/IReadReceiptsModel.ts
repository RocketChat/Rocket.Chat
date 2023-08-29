import type { ReadReceipt, IUser, IMessage } from '@rocket.chat/core-typings';
import type { FindCursor, DeleteResult, UpdateResult, Document, Filter } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IReadReceiptsModel extends IBaseModel<ReadReceipt> {
	findByMessageId(messageId: string): FindCursor<ReadReceipt>;
	removeByUserId(userId: string): Promise<DeleteResult>;
	removeByRoomId(roomId: string): Promise<DeleteResult>;
	removeByRoomIds(roomIds: string[]): Promise<DeleteResult>;
	removeByMessageId(messageId: string): Promise<DeleteResult>;
	removeByMessageIds(messageIds: string[]): Promise<DeleteResult>;
	removeOTRReceiptsUntilDate(roomId: string, until: Date): Promise<DeleteResult>;
	removeByIdPinnedTimestampLimitAndUsers(
		roomId: string,
		ignorePinned: boolean,
		ignoreDiscussion: boolean,
		ts: Filter<IMessage>['ts'],
		users: IUser['_id'][],
		ignoreThreads: boolean,
	): Promise<DeleteResult>;
	setPinnedByMessageId(messageId: string, pinned?: boolean): Promise<Document | UpdateResult>;
	setAsThreadById(messageId: string): Promise<Document | UpdateResult>;
}
