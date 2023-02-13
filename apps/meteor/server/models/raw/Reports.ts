import type { IMessage, IReport, RocketChatRecordDeleted, MsgGroupedIReport } from '@rocket.chat/core-typings';
import type { FindPaginated, IReportsModel } from '@rocket.chat/model-typings';
import type { Db, Collection, FindCursor, UpdateResult, Document, AggregationCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { readSecondaryPreferred } from '../../database/readSecondaryPreferred';

export class ReportsRaw extends BaseRaw<IReport> implements IReportsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IReport>>) {
		super(db, 'reports', trash);
	}

	createWithMessageDescriptionAndUserId(message: IMessage, description: string, userId: string): ReturnType<BaseRaw<IReport>['insertOne']> {
		const record: Pick<IReport, 'message' | 'description' | 'ts' | 'userId'> = {
			message,
			description,
			ts: new Date(),
			userId,
		};
		return this.insertOne(record);
	}

	// find

	findReportsBetweenDates(
		latest: Date,
		oldest: Date,
		offset = 0,
		count = 20,
		sort?: any,
		selector?: string,
	): AggregationCursor<MsgGroupedIReport> {
		const query = {
			'reports._hidden': {
				$ne: true,
			},
			'reports.ts': {
				$lt: latest,
				$gt: oldest,
			},
		};

		const cquery = selector
			? {
					$or: [
						{
							'reports.message.msg': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.description': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.message.u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		const params = [
			{
				$group: {
					_id: { message: '$msg.message', user: '$message.u._id' },
					reports: { $push: '$$ROOT' },
				},
			},
			{ $match: { ...query, ...cquery } },
			{
				$sort: sort || {
					ts: -1,
				},
			},
			{
				$skip: offset,
			},
			{
				$limit: count,
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findReportsByRoom(roomId: string, offset = 0, count = 20, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message.rid': roomId,
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

	findReportsByUser(userId: string, offset = 0, count = 20, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>> {
		const query = {
			_hidden: {
				$ne: true,
			},
			userId,
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

	async findReportsByMessageId(messageId: string, offset = 0, count?: number, sort?: any, selector?: string): Promise<IReport[]> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message._id': messageId,
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
							'u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		// get the user data from collection users for each report

		const lookup = [
			{
				$lookup: {
					from: 'users',
					localField: 'userId',
					foreignField: '_id',
					pipeline: [
						{
							$project: {
								_id: 1,
								username: 1,
								name: 1,
								active: 1,
								avatarETag: 1,
								createdAt: 1,
							},
						},
					],
					as: 'reportedBy',
				},
			},
			{
				$match: {
					...query,
					...cquery,
				},
			},
			{
				$sort: sort || {
					ts: -1,
				},
			},
			{
				$skip: offset,
			},
			{
				$limit: count,
			},
			{
				$unwind: {
					path: '$reportedBy',
					preserveNullAndEmptyArrays: true,
				},
			},
		];

		const reports: Document[] = await this.col.aggregate(lookup, { readPreference: readSecondaryPreferred() }).toArray();

		return reports as IReport[];
	}

	findReportsAfterDate(oldest: Date, offset = 0, count = 20, sort?: any, selector?: string): AggregationCursor<MsgGroupedIReport> {
		const query = {
			'reports._hidden': {
				$ne: true,
			},
			'reports.ts': {
				$gt: oldest,
			},
		};

		const cquery = selector
			? {
					$or: [
						{
							'reports.message.msg': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.description': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.message.u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		const params = [
			{
				$group: {
					_id: { message: '$message.msg', user: '$message.u._id' },
					reports: { $push: '$$ROOT' },
				},
			},
			{ $match: { ...query, ...cquery } },
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
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findReportsBeforeDate(latest: Date, offset = 0, count = 20, sort?: any, selector?: string): AggregationCursor<MsgGroupedIReport> {
		const query = {
			'reports._hidden': {
				$ne: true,
			},
			'reports.ts': {
				$lt: latest,
			},
		};

		const cquery = selector
			? {
					$or: [
						{
							'reports.message.msg': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.description': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.message.u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		const params = [
			{
				$group: {
					_id: { message: '$message.msg', user: '$message.u._id' },
					reports: { $push: '$$ROOT' },
				},
			},
			{ $match: { ...query, ...cquery } },
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
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	// update

	hideReportById(_id: string, userId: string): Promise<UpdateResult | Document> {
		const query = {
			_id,
		};

		const update = {
			$set: {
				_hidden: true,
				_hiddenAt: new Date(),
				_hiddenBy: userId,
			},
		};

		return this.updateOne(query, update);
	}

	hideReportsByMessageId(messageId: string, userId: string): Promise<UpdateResult | Document> {
		const query = {
			'message._id': messageId,
		};

		const update = {
			$set: {
				_hidden: true,
				_hiddenAt: new Date(),
				_hiddenBy: userId,
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

	// 	async countReports(): Promise<number> & void {
	// 		const query = {
	// 			_hidden: {
	// 				$ne: true,
	// 			},
	// 		};

	// 		return this.col.estimatedDocumentCount(query);
	// 	}

	async countGroupedReports(latest?: number, oldest?: number, selector?: string): Promise<number> {
		const query = {
			'reports._hidden': {
				$ne: true,
			},
			'reports.ts': {
				$lt: latest || new Date(),
				$gt: oldest || new Date(0),
			},
		};

		console.log(query);

		const cquery = selector
			? {
					$or: [
						{
							'reports.message.msg': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.description': {
								$regex: selector,
								$options: 'i',
							},
						},
						{
							'reports.message.u.username': {
								$regex: selector,
								$options: 'i',
							},
						},
					],
			  }
			: {};

		const params = [
			{
				$group: {
					_id: { message: '$message.msg', user: '$message.u._id' },
					reports: { $push: '$$ROOT' },
				},
			},
			{ $match: { ...query, ...cquery } },
			{
				$count: 'total_count',
			},
		];

		const result = await this.col.aggregate(params, { allowDiskUse: true }).toArray();

		console.log(result);

		return result[0]?.total_count || 0;
	}
}
