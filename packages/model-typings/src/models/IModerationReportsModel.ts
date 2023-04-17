import type { IModerationReport, IMessage, IModerationAudit } from '@rocket.chat/core-typings';
import type { AggregationCursor, Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export type PaginationParams<T extends Document> = {
	count: number;
	offset: number;
	sort: FindOptions<T>['sort'];
};

export interface IModerationReportsModel extends IBaseModel<IModerationReport> {
	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		room: IModerationReport['room'],
		reportedBy: IModerationReport['reportedBy'],
	): ReturnType<IBaseModel<IModerationReport>['insertOne']>;

	findReportsGroupedByUser(
		latest: Date,
		oldest: Date,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): AggregationCursor<IModerationAudit>;

	findReportsByRoom(
		roomId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<IModerationReport>>;

	findReportsByUser(
		userId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<IModerationReport>>;

	findReportsByMessageId(
		messageId: IModerationReport['message']['_id'],
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>>;

	findUserMessages(
		userId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'message' | 'ts' | 'room'>>>;

	hideReportById(
		reportId: IModerationReport['_id'],
		userId: string,
		reasonForHiding: string,
		actionTaken: string,
	): Promise<UpdateResult | Document>;

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
