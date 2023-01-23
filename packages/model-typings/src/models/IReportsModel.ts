import type { IReport, IMessage } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IReportsModel extends IBaseModel<IReport> {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		userId: string,
	): ReturnType<IBaseModel<IReport>['insertOne']>;

	findReportsBetweenDates(latest: Date, oldest: Date | undefined, offset?: number, count?: number): FindPaginated<FindCursor<IReport>>;

	findReportsByRoom(roomId: string, offset?: number, count?: number): FindPaginated<FindCursor<IReport>>;

	findReportsByUser(userId: string, offset?: number, count?: number): FindPaginated<FindCursor<IReport>>;

	findReportsAfterDate(latest: Date, offset?: number, count?: number): FindPaginated<FindCursor<IReport>>;

	findReportsBeforeDate(oldest: Date, offset?: number, count?: number): FindPaginated<FindCursor<IReport>>;
}
