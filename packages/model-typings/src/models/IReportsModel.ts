import type { IReport, IMessage, IModerationAudit } from '@rocket.chat/core-typings';
import type { AggregationCursor, Document, FindCursor, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IReportsModel extends IBaseModel<IReport> {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		room: IReport['room'],
		reportedBy: IReport['reportedBy'],
	): ReturnType<IBaseModel<IReport>['insertOne']>;

	findGroupedReports(
		latest?: Date,
		oldest?: Date,
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): AggregationCursor<IModerationAudit>;

	findReportsByRoom(roomId: string, offset?: number, count?: number, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>>;

	findReportsByUser(userId: string, offset?: number, count?: number, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>>;

	findReportsByMessageId(
		messageId: IReport['message']['_id'],
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): FindPaginated<FindCursor<Pick<IReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>>;

	findUserMessages(
		userId: string,
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): FindPaginated<FindCursor<Pick<IReport, '_id' | 'message' | 'ts' | 'room'>>>;

	hideReportById(reportId: IReport['_id'], userId: string, reasonForHiding: string, actionTaken: string): Promise<UpdateResult | Document>;

	hideReportsByMessageId(
		messageId: IReport['message']['_id'],
		userId: string,
		reasonForHiding: string,
		actionTaken: string,
	): Promise<UpdateResult | Document>;

	hideReportsByUserId(userId: string, moderatorId: string, reasonForHiding: string, actionTaken: string): Promise<UpdateResult | Document>;

	countReportsByMessageId(messageId: IReport['message']['_id'], count?: number): Promise<number>;

	countGroupedReports(latest?: Date, oldest?: Date, selector?: string): Promise<number>;

	getDistinctRooms(): Promise<Array<{ _id: string }>>;

	getDistinctUsers(): Promise<Array<{ _id: string }>>;
}
