import type { IAnalytic, IRoom } from '@rocket.chat/core-typings';
import type { AggregationCursor, Cursor, SortOptionObject, UpdateWriteOpResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IAnalyticsModel extends IBaseModel<IAnalytic> {
	saveMessageSent({ room, date }: { room: IRoom; date: IAnalytic['date'] }): Promise<UpdateWriteOpResult>;
	saveUserData({ date }: { date: IAnalytic['date'] }): Promise<UpdateWriteOpResult>;
	saveMessageDeleted({ room, date }: { room: { _id: string }; date: IAnalytic['date'] }): Promise<UpdateWriteOpResult>;
	getMessagesSentTotalByDate(params: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: SortOptionObject<IAnalytic>; count?: number };
	}): AggregationCursor<{
		_id: IAnalytic['date'];
		messages: number;
	}>;
	getMessagesOrigin({ start, end }: { start: IAnalytic['date']; end: IAnalytic['date'] }): AggregationCursor<{
		t: IRoom['t'];
		messages: number;
	}>;
	getMostPopularChannelsByMessagesSentQuantity(params: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: SortOptionObject<IAnalytic>; count?: number };
	}): AggregationCursor<{
		t: IRoom['t'];
		name: string;
		messages: number;
		usernames: string[];
	}>;
	getTotalOfRegisteredUsersByDate(params: {
		start: IAnalytic['date'];
		end: IAnalytic['date'];
		options?: { sort?: SortOptionObject<IAnalytic>; count?: number };
	}): AggregationCursor<{
		_id: IAnalytic['date'];
		users: number;
	}>;
	findByTypeBeforeDate({ type, date }: { type: IAnalytic['type']; date: IAnalytic['date'] }): Cursor<IAnalytic>;
}
