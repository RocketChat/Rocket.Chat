import type {
	IMessage,
	IModerationAudit,
	IModerationReport,
	RocketChatRecordDeleted,
	MessageReport,
	UserReport,
} from '@rocket.chat/core-typings';
import type { FindPaginated, IModerationReportsModel, PaginationParams } from '@rocket.chat/model-typings';
import type { AggregationCursor, Collection, Db, Document, FindCursor, FindOptions, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ModerationReportsRaw extends BaseRaw<IModerationReport> implements IModerationReportsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IModerationReport>>) {
		super(db, 'moderation_reports', trash);
	}

	modelIndexes(): IndexDescription[] | undefined {
		return [
			{ key: { 'ts': 1, 'reports.ts': 1 } },
			{ key: { 'message.u._id': 1, 'ts': 1 } },
			{ key: { 'reportedUser._id': 1, 'ts': 1 } },
			{ key: { 'message.rid': 1, 'ts': 1 } },
			{ key: { userId: 1, ts: 1 } },
			{ key: { 'message._id': 1, 'ts': 1 } },
		];
	}

	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: IModerationReport['description'],
		room: IModerationReport['room'],
		reportedBy: IModerationReport['reportedBy'],
	): ReturnType<BaseRaw<IModerationReport>['insertOne']> {
		const record: Pick<IModerationReport, 'message' | 'description' | 'ts' | 'reportedBy' | 'room'> = {
			message,
			description,
			reportedBy,
			room,
			ts: new Date(),
		};
		return this.insertOne(record);
	}

	createWithDescriptionAndUser(
		reportedUser: UserReport['reportedUser'],
		description: UserReport['description'],
		reportedBy: UserReport['reportedBy'],
	): ReturnType<BaseRaw<IModerationReport>['insertOne']> {
		const record = {
			description,
			reportedBy,
			reportedUser,
			ts: new Date(),
		};

		return this.insertOne(record);
	}

	findMessageReportsGroupedByUser(
		latest: Date,
		oldest: Date,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): AggregationCursor<IModerationAudit> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$lt: latest,
				$gt: oldest,
			},
			...this.getSearchQueryForSelector(selector),
		};

		const { sort, offset, count } = pagination;

		const params = [
			{ $match: query },
			{
				$group: {
					_id: { user: '$message.u._id' },
					reports: { $first: '$$ROOT' },
					rooms: { $addToSet: '$room' }, // to be replaced with room
					count: { $sum: 1 },
				},
			},
			{
				$sort: sort || {
					'reports.ts': -1,
				},
			},
			{
				$skip: offset,
			},
			{
				$limit: count,
			},
			{
				$lookup: {
					from: 'users',
					localField: '_id.user',
					foreignField: '_id',
					as: 'user',
				},
			},
			{
				$unwind: {
					path: '$user',
					preserveNullAndEmptyArrays: true,
				},
			},
			{
				// TODO: maybe clean up the projection, i.e. exclude things we don't need
				$project: {
					_id: 0,
					message: '$reports.message.msg',
					msgId: '$reports.message._id',
					ts: '$reports.ts',
					username: '$reports.message.u.username',
					name: '$reports.message.u.name',
					userId: '$reports.message.u._id',
					isUserDeleted: { $cond: ['$user', false, true] },
					count: 1,
					rooms: 1,
				},
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	countMessageReportsInRange(latest: Date, oldest: Date, selector: string): Promise<number> {
		return this.col.countDocuments({
			_hidden: { $ne: true },
			ts: { $lt: latest, $gt: oldest },
			...this.getSearchQueryForSelector(selector),
		});
	}

	findReportedMessagesByReportedUserId(
		userId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
		options: FindOptions<IModerationReport> = {},
	): FindPaginated<FindCursor<Pick<MessageReport, '_id' | 'message' | 'ts' | 'room'>>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message.u._id': userId,
		};

		const { sort, offset, count } = pagination;

		const fuzzyQuery = selector
			? {
					'message.msg': {
						$regex: selector,
						$options: 'i',
					},
			  }
			: {};

		const params = {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
			projection: {
				_id: 1,
				message: 1,
				ts: 1,
				room: 1,
			},
			...options,
		};

		return this.findPaginated({ ...query, ...fuzzyQuery }, params);
	}

	findReportsByMessageId(
		messageId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
		options: FindOptions<IModerationReport> = {},
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message._id': messageId,
			...this.getSearchQueryForSelector(selector),
		};

		const { count, offset, sort } = pagination;

		const opts = {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
			projection: {
				_id: 1,
				description: 1,
				ts: 1,
				reportedBy: 1,
				room: 1,
			},
			...options,
		};

		return this.findPaginated(query, opts);
	}

	async hideMessageReportsByMessageId(messageId: string, userId: string, reason: string, action: string): Promise<UpdateResult | Document> {
		const query = {
			'message._id': messageId,
		};

		const update = {
			$set: {
				_hidden: true,
				moderationInfo: { hiddenAt: new Date(), moderatedBy: userId, reason, action },
			},
		};

		return this.updateMany(query, update);
	}

	async hideMessageReportsByUserId(userId: string, moderatorId: string, reason: string, action: string): Promise<UpdateResult | Document> {
		const query = {
			'message.u._id': userId,
		};

		const update = {
			$set: {
				_hidden: true,
				moderationInfo: { hiddenAt: new Date(), moderatedBy: moderatorId, reason, action },
			},
		};
		return this.updateMany(query, update);
	}

	private getSearchQueryForSelector(selector?: string): any {
		const messageExistsQuery = { message: { $exists: true } };
		if (!selector) {
			return messageExistsQuery;
		}
		return {
			...messageExistsQuery,
			$or: [
				{
					'message.msg': {
						$regex: selector,
						$options: 'i',
					},
				},
				{
					description: {
						$regex: selector,
						$options: 'i',
					},
				},
				{
					'message.u.username': {
						$regex: selector,
						$options: 'i',
					},
				},
				{
					'message.u.name': {
						$regex: selector,
						$options: 'i',
					},
				},
			],
		};
	}
}
