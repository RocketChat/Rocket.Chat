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

	countReportsInRange(latest: Date, oldest: Date, selector: string): Promise<number>;

	findReportsByMessageId(
		messageId: IModerationReport['message']['_id'],
		selector: string,
		pagination: PaginationParams<IModerationReport>,
		options?: FindOptions<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>>;

	findReportedMessagesByReportedUserId(
		userId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
		options?: FindOptions<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'message' | 'ts' | 'room'>>>;

	hideReportsByMessageId(
		messageId: IModerationReport['message']['_id'],
		userId: string,
		reason: string,
		action: string,
	): Promise<UpdateResult | Document>;

	hideReportsByUserId(userId: string, moderatorId: string, reason: string, action: string): Promise<UpdateResult | Document>;
}
