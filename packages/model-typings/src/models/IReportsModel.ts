import type { IReport, IMessage, MsgGroupedIReport } from '@rocket.chat/core-typings';
import type { AggregationCursor, Document, FindCursor, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IReportsModel extends IBaseModel<IReport> {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		userId: string,
	): ReturnType<IBaseModel<IReport>['insertOne']>;

	findReportsBetweenDates(
		latest: Date,
		oldest: Date,
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): AggregationCursor<MsgGroupedIReport>;

	findReportsByRoom(roomId: string, offset?: number, count?: number, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>>;

	findReportsByUser(userId: string, offset?: number, count?: number, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>>;

	findReportsByMessageId(
		messageId: IReport['message']['_id'],
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): Promise<IReport[]>;

	findReportsAfterDate(latest: Date, offset?: number, count?: number, sort?: any, selector?: string): AggregationCursor<MsgGroupedIReport>;

	findReportsBeforeDate(oldest: Date, offset?: number, count?: number, sort?: any, selector?: string): AggregationCursor<MsgGroupedIReport>;

	hideReportById(reportId: IReport['_id'], userId: string): Promise<UpdateResult | Document>;

	hideReportsByMessageId(messageId: IReport['message']['_id'], userId: string): Promise<UpdateResult | Document>;

	countReportsByMessageId(messageId: IReport['message']['_id'], count?: number): Promise<number>;

	// countReports(): Promise<number>;
}
