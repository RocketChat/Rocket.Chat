import type { IMessage, IReport, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IReportsModel } from '@rocket.chat/model-typings';
import type { Db, Collection, FindCursor, UpdateResult, Document, Filter } from 'mongodb';

import { BaseRaw } from './BaseRaw';

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
		cquery?: Filter<IReport>,
	): FindPaginated<FindCursor<IReport>> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$lt: latest,
				$gt: oldest,
			},
			...cquery,
		};

		return this.findPaginated(query, {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsByRoom(roomId: string, offset = 0, count = 20, sort?: any, cquery?: Filter<IReport>): FindPaginated<FindCursor<IReport>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message.rid': roomId,
			...cquery,
		};

		return this.findPaginated(query, {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsByUser(userId: string, offset = 0, count = 20, sort?: any, cquery?: Filter<IReport>): FindPaginated<FindCursor<IReport>> {
		const query = {
			_hidden: {
				$ne: true,
			},
			userId,
			...cquery,
		};

		return this.findPaginated(query, {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsByMessageId(
		messageId: string,
		offset = 0,
		count = 20,
		sort?: any,
		cquery?: Filter<IReport>,
	): FindPaginated<FindCursor<IReport>> {
		const query = {
			'_hidden': {
				$ne: true,
			},
			'message._id': messageId,
			...cquery,
		};

		return this.findPaginated(query, {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsAfterDate(oldest: Date, offset = 0, count = 20, sort?: any, cquery?: Filter<IReport>): FindPaginated<FindCursor<IReport>> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$gt: oldest,
			},
			...cquery,
		};

		return this.findPaginated(query, {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsBeforeDate(latest: Date, offset = 0, count = 20, sort?: any, cquery?: Filter<IReport>): FindPaginated<FindCursor<IReport>> {
		const query = {
			_hidden: {
				$ne: true,
			},
			ts: {
				$lt: latest,
			},
			...cquery,
		};

		return this.findPaginated(query, {
			sort: sort || {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
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
