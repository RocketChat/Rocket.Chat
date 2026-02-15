import type { IAnalytics, IRoom } from '@rocket.chat/core-typings';
import type { AggregationCursor, FindCursor, FindOptions, UpdateResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { IChannelsWithNumberOfMessagesBetweenDate } from './IRoomsModel';

export interface IAnalyticsModel extends IBaseModel<IAnalytics> {
	saveMessageSent({ room, date }: { room: IRoom; date: IAnalytics['date'] }): Promise<Document | UpdateResult>;
	saveUserData({ date }: { date: IAnalytics['date'] }): Promise<Document | UpdateResult>;
	saveMessageDeleted({ room, date }: { room: { _id: string }; date: IAnalytics['date'] }): Promise<Document | UpdateResult>;
	getMessagesSentTotalByDate(params: {
		start: IAnalytics['date'];
		end: IAnalytics['date'];
		options?: { sort?: FindOptions<IAnalytics>['sort']; count?: number };
	}): AggregationCursor<{
		_id: IAnalytics['date'];
		messages: number;
	}>;
	getMessagesOrigin({ start, end }: { start: IAnalytics['date']; end: IAnalytics['date'] }): AggregationCursor<{
		t: IRoom['t'];
		messages: number;
	}>;
	getMostPopularChannelsByMessagesSentQuantity(params: {
		start: IAnalytics['date'];
		end: IAnalytics['date'];
		options?: { sort?: FindOptions<IAnalytics>['sort']; count?: number };
	}): AggregationCursor<{
		t: IRoom['t'];
		name: string;
		messages: number;
		usernames: string[];
	}>;
	getTotalOfRegisteredUsersByDate(params: {
		start: IAnalytics['date'];
		end: IAnalytics['date'];
		options?: { sort?: FindOptions<IAnalytics>['sort']; count?: number };
	}): AggregationCursor<{
		_id: IAnalytics['date'];
		users: number;
	}>;
	findByTypeBeforeDate({ type, date }: { type: IAnalytics['type']; date: IAnalytics['date'] }): FindCursor<IAnalytics>;
	findRoomsByTypesWithNumberOfMessagesBetweenDate(params: {
		types: Array<IRoom['t']>;
		start: number;
		end: number;
		startOfLastWeek: number;
		endOfLastWeek: number;
		options?: any;
	}): AggregationCursor<{ channels: IChannelsWithNumberOfMessagesBetweenDate[]; total: number }>;
}
