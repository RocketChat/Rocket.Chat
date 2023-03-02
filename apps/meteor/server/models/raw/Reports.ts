import type { IMessage, IReport, RocketChatRecordDeleted, IModerationAudit } from '@rocket.chat/core-typings';
import type { FindPaginated, IReportsModel } from '@rocket.chat/model-typings';
import type { Db, Collection, FindCursor, UpdateResult, Document, AggregationCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ReportsRaw extends BaseRaw<IReport> implements IReportsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<IReport>>) {
		super(db, 'reports', trash);
	}

	createWithMessageDescriptionAndUserId(
		message: IMessage,
		description: string,
		room: IReport['room'],
		reportedBy: IReport['reportedBy'],
	): ReturnType<BaseRaw<IReport>['insertOne']> {
		const record: Pick<IReport, 'message' | 'description' | 'ts' | 'reportedBy' | 'room'> = {
			message,
			description,
			reportedBy,
			room,
			ts: new Date(),
		};
		return this.insertOne(record);
	}

	findGroupedReports(
		latest?: Date,
		oldest?: Date,
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
				$lt: latest || new Date(),
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
					reports: { $first: '$$ROOT' },
					roomIds: { $addToSet: '$message.rid' }, // to be replaced with room
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
					roomIds: 1,
				},
			},
		];

		return this.col.aggregate(params, { allowDiskUse: true });
	}

	findUserMessages(
		userId: string,
		offset = 0,
		count?: number,
		sort?: any,
		selector?: string,
	): FindPaginated<FindCursor<Pick<IReport, '_id' | 'message' | 'ts' | 'room'>>> {
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

		const params = {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
			project: {
				_id: 1,
				message: 1,
				ts: 1,
				room: 1,
			},
		};

		return this.findPaginated({ ...query, ...cquery }, params);
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
	): FindPaginated<FindCursor<Pick<IReport, '_id' | 'description' | 'reportedBy' | 'ts' | 'room'>>> {
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

		const lookup = {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
			project: {
				_id: 1,
				description: 1,
				ts: 1,
				reportedBy: 1,
				room: 1,
			},
		};

		return this.findPaginated({ ...query, ...cquery }, lookup);
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
