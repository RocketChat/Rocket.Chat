import type { IMessage, IRoom, IUser, ILivechatDepartment } from '@rocket.chat/core-typings';
import type { AggregationCursor, Cursor, FindOneOptions, WithoutProjection, CollectionAggregationOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IMessagesModel extends IBaseModel<IMessage> {
	findVisibleByMentionAndRoomId(
		username: IUser['username'],
		rid: IRoom['_id'],
		options: WithoutProjection<FindOneOptions<IMessage>>,
	): Cursor<IMessage>;
	findStarredByUserAtRoom(
		userId: IUser['_id'],
		roomId: IRoom['_id'],
		options: WithoutProjection<FindOneOptions<IMessage>>,
	): Cursor<IMessage>;

	findByRoomIdAndType(roomId: IRoom['_id'], type: IMessage['t'], options?: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;

	findSnippetedByRoom(roomId: IRoom['_id'], options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;

	findDiscussionsByRoom(rid: IRoom['_id'], options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;

	findDiscussionsByRoomAndText(rid: IRoom['_id'], text: string, options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;

	findAllNumberOfTransferredRooms(params: {
		start: string;
		end: string;
		departmentId: ILivechatDepartment['_id'];
		onlyCount: boolean;
		options: any;
	}): AggregationCursor<any>;

	getTotalOfMessagesSentByDate(params: { start: Date; end: Date; options?: any }): Promise<any[]>;

	findLivechatClosedMessages(rid: IRoom['_id'], options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;

	countRoomsWithStarredMessages(options: CollectionAggregationOptions): Promise<number>;

	countRoomsWithPinnedMessages(options: CollectionAggregationOptions): Promise<number>;

	countE2EEMessages(options: WithoutProjection<FindOneOptions<IMessage>>): Promise<number>;

	findPinned(options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;

	findStarred(options: WithoutProjection<FindOneOptions<IMessage>>): Cursor<IMessage>;
}
