import type {
	IMessage,
	IReport,
	RocketChatRecordDeleted,
	IModerationAudit,
	IUserReportedMessages,
	IReportedMessageInfo,
} from '@rocket.chat/core-typings';
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
				$lookup: {
					from: 'rooms',
					localField: 'message.rid',
					foreignField: '_id',
					as: 'room',
				},
			},
			{
				$group: {
					_id: { user: '$message.u._id' },
					reports: { $first: '$$ROOT' },
					roomIds: { $addToSet: '$message.rid' },
					count: { $sum: 1 },
				},
			},
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'roomIds',
					foreignField: '_id',
					as: 'room',
					pipeline: [
						{
							$project: {
								_id: 1,
								name: {
									$switch: {
										branches: [
											{
												case: { $eq: ['$t', 'd'] },
												then: 'private',
											},
											{
												case: { $ifNull: ['$prid', false] },
												then: '$fname',
											},
											{
												case: { $ifNull: ['$prid', true] },
												then: '$name',
											},
										],
										default: 'notExist',
									},
								},
							},
						},
					],
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
					userId: '$_id.user',
					count: 1,
					roomIds: 1,
					room: 1,
				},
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findReportsAfterDate(oldest: Date, offset = 0, count = 20, sort?: any, selector?: string): AggregationCursor<IModerationAudit> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$gt: oldest,
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
					_id: { userId: '$message.u._id', userName: '$message.u.username' },
					reports: { $first: '$$ROOT' },
					roomIds: { $addToSet: '$message.rid' },
					count: { $sum: 1 },
				},
			},
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'roomIds',
					foreignField: '_id',
					as: 'room',
					pipeline: [
						{
							$project: {
								_id: 1,
								name: {
									$switch: {
										branches: [
											{
												case: { $eq: ['$t', 'd'] },
												then: 'private',
											},
											{
												case: { $ifNull: ['$prid', false] },
												then: '$fname',
											},
											{
												case: { $ifNull: ['$prid', true] },
												then: '$name',
											},
										],
										default: 'notExist',
									},
								},
							},
						},
					],
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
					reports: 0,
					message: '$reports.message.msg',
					msgId: '$reports.message._id',
					ts: '$reports.ts',
					userId: '$_id.user',
					username: '$reports.message.u.username',
					name: '$reports.message.u.name',
					count: 1,
					roomIds: 1,
					room: 1,
				},
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findReportsBeforeDate(latest: Date, offset = 0, count = 20, sort?: any, selector?: string): AggregationCursor<IModerationAudit> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$lt: latest,
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
					_id: { user: '$message.u._id', userName: '$message.u.username' },
					reports: { $first: '$$ROOT' },
					roomIds: { $addToSet: '$message.rid' },
					count: { $sum: 1 },
				},
			},
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'roomIds',
					foreignField: '_id',
					as: 'room',
					pipeline: [
						{
							$project: {
								_id: 1,
								name: {
									$switch: {
										branches: [
											{
												case: { $eq: ['$t', 'd'] },
												then: 'private',
											},
											{
												case: { $ifNull: ['$prid', false] },
												then: '$fname',
											},
											{
												case: { $ifNull: ['$prid', true] },
												then: '$name',
											},
										],
										default: 'notExist',
									},
								},
							},
						},
					],
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
					userId: '$_id.user',
					count: 1,
					roomIds: 1,
					room: 1,
				},
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findUserMessages(userId: string, offset = 0, count?: number, sort?: any, selector?: string): AggregationCursor<IUserReportedMessages> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message.u._id': userId,
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
					],
			  }
			: {};

		const params = [
			{ $match: { ...query, ...cquery } },
			{
				$lookup: {
					from: 'rocketchat_room',
					localField: 'message.rid',
					foreignField: '_id',
					as: 'message.room',
					pipeline: [
						{
							$project: {
								_id: 1,
								name: {
									$switch: {
										branches: [
											{
												case: { $eq: ['$t', 'd'] },
												then: 'private',
											},
											{
												case: { $ifNull: ['$prid', false] },
												then: '$fname',
											},
											{
												case: { $ifNull: ['$prid', true] },
												then: '$name',
											},
										],
										default: 'notExist',
									},
								},
							},
						},
					],
				},
			},
			{
				$group: {
					_id: {
						user: '$message.u._id',
					},
					messages: { $addToSet: '$message' },
				},
			},

			{
				$addFields: {
					count: { $size: '$messages' },
				},
			},
			{
				$sort: sort || {
					'messages.ts': -1,
				},
			},
			{
				$skip: offset,
			},
			...(count !== undefined ? [{ $limit: count }] : []),
			{
				$project: {
					_id: 0,
					messages: 1,
					count: 1,
					room: 1,
				},
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

	findReportsByMessageId(
		messageId: string,
		offset = 0,
		count?: number,
		sort?: any,
		selector?: string,
	): AggregationCursor<IReportedMessageInfo> {
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
				$match: {
					...query,
					...cquery,
				},
			},
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
					as: 'reporter',
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
			{
				$project: {
					_id: 1,
					userId: 1,
					description: 1,
					ts: 1,
					reporter: 1,
				},
			},
		];

		return this.col.aggregate(lookup, { readPreference: readSecondaryPreferred() });
	}

	// update

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

	// 	async countReports(): Promise<number> & void {
	// 		const query = {
	// 			_hidden: {
	// 				$ne: true,
	// 			},
	// 		};

	// 		return this.col.estimatedDocumentCount(query);
	// 	}

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
}
