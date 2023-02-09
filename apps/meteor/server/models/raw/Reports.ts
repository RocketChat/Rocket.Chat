import type { IMessage, IReport, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
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
	): FindPaginated<FindCursor<IReport>> {
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

	async findReportsByMessageId(
		messageId: string,
		offset = 0,
		count = 20,
		sort?: any,
		selector?: string,
	): Promise<AggregationCursor<IReport[]>> {
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

		return this.col.aggregate(lookup, { readPreference: readSecondaryPreferred() });
	}

	findReportsAfterDate(oldest: Date, offset = 0, count = 20, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>> {
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

	findReportsBeforeDate(latest: Date, offset = 0, count = 20, sort?: any, selector?: string): FindPaginated<FindCursor<IReport>> {
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
}
