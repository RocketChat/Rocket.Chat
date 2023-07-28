import type { IModerationReport, IMessage, IModerationAudit, MessageReport } from '@rocket.chat/core-typings';
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

	createWithDescriptionAndUser(
		reportedUser: Exclude<IModerationReport['reportedUser'], undefined>,
		description: string,
		reportedBy: IModerationReport['reportedBy'],
	): ReturnType<IBaseModel<IModerationReport>['insertOne']>;

	findMessageReportsGroupedByUser(
		latest: Date,
		oldest: Date,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): AggregationCursor<IModerationAudit>;

	countMessageReportsInRange(latest: Date, oldest: Date, selector: string): Promise<number>;

	findReportsByMessageId(
		messageId: IMessage['_id'],
		selector: string,
		pagination: PaginationParams<IModerationReport>,
		options?: FindOptions<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>>;

	findReportedMessagesByReportedUserId(
		userId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
		options?: FindOptions<IModerationReport>,
	): FindPaginated<FindCursor<Pick<MessageReport, '_id' | 'message' | 'ts' | 'room'>>>;

	hideMessageReportsByMessageId(
		messageId: IMessage['_id'],
		userId: string,
		reason: string,
		action: string,
	): Promise<UpdateResult | Document>;

	hideMessageReportsByUserId(userId: string, moderatorId: string, reason: string, action: string): Promise<UpdateResult | Document>;
}
