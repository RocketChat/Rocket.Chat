import type { IModerationReport, IMessage, IModerationAudit } from '@rocket.chat/core-typings';
import type { AggregationCursor, Document, FindCursor, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IModerationReportsModel extends IBaseModel<IModerationReport> {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		room: IModerationReport['room'],
		reportedBy: IModerationReport['reportedBy'],
	): ReturnType<IBaseModel<IModerationReport>['insertOne']>;

	findGroupedReports(
		latest?: Date,
		oldest?: Date,
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): AggregationCursor<IModerationAudit>;

	findReportsByRoom(roomId: string, offset?: number, count?: number, sort?: any, selector?: string): FindPaginated<FindCursor<IModerationReport>>;

	findReportsByUser(userId: string, offset?: number, count?: number, sort?: any, selector?: string): FindPaginated<FindCursor<IModerationReport>>;

	findReportsByMessageId(
		messageId: IModerationReport['message']['_id'],
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>>;

	findUserMessages(
		userId: string,
		offset?: number,
		count?: number,
		sort?: any,
		selector?: string,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'message' | 'ts' | 'room'>>>;

	hideReportById(reportId: IModerationReport['_id'], userId: string, reasonForHiding: string, actionTaken: string): Promise<UpdateResult | Document>;

	hideReportsByMessageId(
		messageId: IModerationReport['message']['_id'],
		userId: string,
		reasonForHiding: string,
		actionTaken: string,
	): Promise<UpdateResult | Document>;

	hideReportsByUserId(userId: string, moderatorId: string, reasonForHiding: string, actionTaken: string): Promise<UpdateResult | Document>;

	countReportsByMessageId(messageId: IModerationReport['message']['_id'], count?: number): Promise<number>;

	countGroupedReports(latest?: Date, oldest?: Date, selector?: string): Promise<number>;

	getDistinctRooms(): Promise<Array<{ _id: string }>>;

	getDistinctUsers(): Promise<Array<{ _id: string }>>;
}
