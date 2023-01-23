import type { IMessage, IReport, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, IReportsModel } from '@rocket.chat/model-typings';
import type { Db, Collection, FindCursor } from 'mongodb';

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

	findReportsBetweenDates(latest: Date, oldest: Date, offset = 0, count = 20): FindPaginated<FindCursor<IReport>> {
		const query = {
			ts: {
				$lt: latest,
				$gt: oldest,
			},
		};

		return this.findPaginated(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsByRoom(roomId: string, offset = 0, count = 20): FindPaginated<FindCursor<IReport>> {
		const query = {
			'message.rid': roomId,
		};

		return this.findPaginated(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsByUser(userId: string, offset = 0, count = 20): FindPaginated<FindCursor<IReport>> {
		const query = {
			userId,
		};

		return this.findPaginated(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsBeforeDate(oldest: Date, offset = 0, count = 20): FindPaginated<FindCursor<IReport>> {
		const query = {
			ts: {
				$gt: oldest,
			},
		};

		return this.findPaginated(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}

	findReportsAfterDate(latest: Date, offset = 0, count = 20): FindPaginated<FindCursor<IReport>> {
		const query = {
			ts: {
				$lt: latest,
			},
		};

		return this.findPaginated(query, {
			sort: {
				ts: -1,
			},
			skip: offset,
			limit: count,
		});
	}
}
