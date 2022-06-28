import type { IMessage, IRoom, IUser, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { AggregationCursor, FindCursor, FindOptions, AggregateOptions } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IMessagesModel extends IBaseModel<IMessage> {
	findVisibleByMentionAndRoomId(
		username: IUser['username'],
		rid: IRoom['_id'],
		options: FindOptions<IMessage>,
	): FindPaginated<FindCursor<IMessage>>;

	findStarredByUserAtRoom(userId: IUser['_id'], roomId: IRoom['_id'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	findByRoomIdAndType(roomId: IRoom['_id'], type: IMessage['t'], options?: FindOptions<IMessage>): FindCursor<IMessage>;

	findSnippetedByRoom(roomId: IRoom['_id'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	findDiscussionsByRoom(rid: IRoom['_id'], options: FindOptions<IMessage>): FindCursor<IMessage>;

	findDiscussionsByRoomAndText(rid: IRoom['_id'], text: string, options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	findAllNumberOfTransferredRooms(params: {
		start: string;
		end: string;
		departmentId: ILivechatDepartment['_id'];
		onlyCount: boolean;
		options: any;
	}): AggregationCursor<any>;

	getTotalOfMessagesSentByDate(params: { start: Date; end: Date; options?: any }): Promise<any[]>;

	findLivechatClosedMessages(rid: IRoom['_id'], options: FindOptions<IMessage>): FindPaginated<FindCursor<IMessage>>;

	countRoomsWithStarredMessages(options: AggregateOptions): Promise<number>;

	countRoomsWithPinnedMessages(options: AggregateOptions): Promise<number>;

	countE2EEMessages(options: FindOptions<IMessage>): Promise<number>;

	findPinned(options: FindOptions<IMessage>): FindCursor<IMessage>;

	findStarred(options: FindOptions<IMessage>): FindCursor<IMessage>;
}
