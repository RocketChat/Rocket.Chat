import type { IMessage, IModerationAudit, IModerationReport, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IModerationReportsModel, PaginationParams } from '@rocket.chat/model-typings';
import type { AggregationCursor, Collection, Db, Document, FindCursor, IndexDescription, UpdateResult } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ModerationReportsRaw extends BaseRaw<IModerationReport> implements IModerationReportsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IModerationReport>>) {
		super(db, 'moderation_reports', trash);
	}

	modelIndexes(): IndexDescription[] | undefined {
		return [
			{ key: { ts: 1 } },
			{ key: { 'message.u._id': 1, 'ts': 1 } },
			{ key: { 'message.rid': 1, 'ts': 1 } },
			{ key: { userId: 1, ts: 1 } },
			{ key: { 'message._id': 1, 'ts': 1 } },
		];
	}

	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
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

	findReportsGroupedByUser(
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
		};

		const { sort, offset, count } = pagination;

		const cquery = this.getSearchQueryForSelector(selector);

		const params = [
			{ $match: { ...query, ...cquery } },
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
				$project: {
					_id: 0,
					message: '$reports.message.msg',
					msgId: '$reports.message._id',
					ts: '$reports.ts',
					username: '$reports.message.u.username',
					name: '$reports.message.u.name',
					userId: '$reports.message.u._id',
					count: 1,
					rooms: 1,
				},
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findUserMessages(
		userId: string,
		selector: string,
		pagination?: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'message' | 'ts' | 'room'>>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message.u._id': userId,
		};

		const { sort, offset, count } = pagination ?? {};

		const cquery = selector
			? {
					$or: [
						{
							'message.msg': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
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
		};

		return this.findPaginated({ ...query, ...cquery }, params);
	}

	// NOTE: not used
	findReportsByRoom(
		roomId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<IModerationReport>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message.rid': roomId,
		};

		const { count, offset, sort } = pagination;

		const cquery = selector
			? {
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
							'u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		return this.findPaginated(
			{ ...query, ...cquery },
			{
				sort: sort || {
					ts: -1,
				},
				skip: offset,
				limit: count,
			},
		);
	}

	// NOTE: not used
	findReportsByUser(
		userId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<IModerationReport>> {
		const query = {
			_hidden: {
				$ne: true,
			},
			userId,
		};

		const { count, offset, sort } = pagination;

		const cquery = selector
			? {
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
							'u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		return this.findPaginated(
			{ ...query, ...cquery },
			{
				sort: sort || {
					ts: -1,
				},
				skip: offset,
				limit: count,
			},
		);
	}

	findReportsByMessageId(
		messageId: string,
		selector: string,
		pagination: PaginationParams<IModerationReport>,
	): FindPaginated<FindCursor<Pick<IModerationReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message._id': messageId,
		};

		const { count, offset, sort } = pagination;

		const cquery = this.getSearchQueryForSelector(selector);

		// get the user data from collection users for each report

		const lookup = {
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
		};

		return this.findPaginated({ ...query, ...cquery }, lookup);
	}

	async hideReportById(_id: string, userId: string, reasonForHiding: string, actionTaken: string): Promise<UpdateResult | Document> {
		const query = {
			_id,
		};

		const update = {
			$set: {
				_hidden: true,
				moderationInfo: { hiddenAt: new Date(), moderatedBy: userId, reasonForHiding, actionTaken },
			},
		};

		return this.updateOne(query, update);
	}

	async hideReportsByMessageId(
		messageId: string,
		userId: string,
		reasonForHiding: string,
		actionTaken: string,
	): Promise<UpdateResult | Document> {
		const query = {
			'message._id': messageId,
		};

		const update = {
			$set: {
				_hidden: true,
				moderationInfo: { hiddenAt: new Date(), moderatedBy: userId, reasonForHiding, actionTaken },
			},
		};

		return this.updateMany(query, update);
	}

	async hideReportsByUserId(
		userId: string,
		moderatorId: string,
		reasonForHiding: string,
		actionTaken: string,
	): Promise<UpdateResult | Document> {
		const query = {
			'message.u._id': userId,
		};

		const update = {
			$set: {
				_hidden: true,
				moderationInfo: { hiddenAt: new Date(), moderatedBy: moderatorId, reasonForHiding, actionTaken },
			},
		};
		return this.updateMany(query, update);
	}

	// misc

	// method to return the reports count by msgId

	async countReportsByMessageId(messageId: string, count?: number): Promise<number> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message._id': messageId,
		};

		return this.col.countDocuments(query, { limit: count });
	}

	getDistinctRooms(): Promise<{ _id: string }[]> {
		const query = {
			_hidden: {
				$ne: true,
			},
		};

		const params = [
			{
				$match: query,
			},
			{
				$group: {
					_id: '$message.rid',
				},
			},
		];

		return this.col.aggregate(params).toArray() as Promise<{ _id: string }[]>;
	}

	getDistinctUsers(): Promise<{ _id: string }[]> {
		const query = {
			_hidden: {
				$ne: true,
			},
		};

		const params = [
			{
				$match: query,
			},
			{
				$group: {
					_id: '$userId',
				},
			},
		];

		return this.col.aggregate(params).toArray() as Promise<{ _id: string }[]>;
	}

	async countGroupedReports(latest?: Date, oldest?: Date, selector?: string): Promise<number> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$lt: latest,
				$gt: oldest || new Date(0),
			},
		};

		const cquery = selector
			? {
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
					],
			  }
			: {};

		const params = [
			{ $match: { ...query, ...cquery } },

			{
				$group: {
					_id: { user: '$message.u._id' },
					reports: { $push: '$$ROOT' },
				},
			},
			{
				$count: 'total_count',
			},
		];

		const result = await this.col.aggregate(params, { allowDiskUse: true }).toArray();

		return result[0]?.total_count || 0;
	}

	private getSearchQueryForSelector(selector?: string): any {
		if (!selector) {
			return {};
		}
		return {
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
					'u.username': {
						$regex: selector,
						$options: 'i',
					},
				},
			],
		};
	}
}
