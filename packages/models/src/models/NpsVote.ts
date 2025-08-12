import type { INpsVote, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { INpsVoteStatus } from '@rocket.chat/core-typings';
import type { INpsVoteModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Document, FindOptions, IndexDescription, UpdateResult } from 'mongodb';
import { ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class NpsVoteRaw extends BaseRaw<INpsVote> implements INpsVoteModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<INpsVote>>) {
		super(db, 'nps_vote', trash);
	}

	modelIndexes(): IndexDescription[] {
		return [{ key: { npsId: 1, status: 1, sentAt: 1 } }, { key: { npsId: 1, identifier: 1 }, unique: true }];
	}

	findNotSentByNpsId(npsId: string, options?: Omit<FindOptions<INpsVote>, 'sort' | 'limit'>): FindCursor<INpsVote> {
		const query = {
			npsId,
			status: INpsVoteStatus.NEW,
		};
		const cursor = options ? this.find(query, options) : this.find(query);

		return cursor.sort({ ts: 1 }).limit(1000);
	}

	findByNpsIdAndStatus(npsId: string, status: INpsVoteStatus, options?: FindOptions<INpsVote>): FindCursor<INpsVote> {
		const query = {
			npsId,
			status,
		};
		if (options) {
			return this.find(query, options);
		}
		return this.find(query);
	}

	findByNpsId(npsId: string, options?: FindOptions<INpsVote>): FindCursor<INpsVote> {
		const query = {
			npsId,
		};
		if (options) {
			return this.find(query, options);
		}
		return this.find(query);
	}

	save(vote: Omit<INpsVote, '_id' | '_updatedAt'>): Promise<UpdateResult> {
		const { npsId, identifier } = vote;

		const query = {
			npsId,
			identifier,
		};
		const update = {
			$set: {
				...vote,
				_updatedAt: new Date(),
			},
			$setOnInsert: {
				_id: new ObjectId().toHexString(), // TODO this should be done by BaseRaw
			},
		};

		return this.updateOne(query, update, { upsert: true });
	}

	updateVotesToSent(voteIds: string[]): Promise<UpdateResult | Document> {
		const query = {
			_id: { $in: voteIds },
		};
		const update = {
			$set: {
				status: INpsVoteStatus.SENT,
			},
		};
		return this.updateMany(query, update);
	}

	updateOldSendingToNewByNpsId(npsId: string): Promise<UpdateResult | Document> {
		const fiveMinutes = new Date();
		fiveMinutes.setMinutes(fiveMinutes.getMinutes() - 5);

		const query = {
			npsId,
			status: INpsVoteStatus.SENDING,
			sentAt: { $lt: fiveMinutes },
		};
		const update = {
			$set: {
				status: INpsVoteStatus.NEW,
			},
			$unset: {
				sentAt: 1 as const, // why do you do this to me TypeScript?
			},
		};
		return this.updateMany(query, update);
	}

	countByNpsId(npsId: string): Promise<number> {
		return this.countDocuments({ npsId });
	}

	countByNpsIdAndStatus(npsId: string, status: INpsVoteStatus): Promise<number> {
		const query = {
			npsId,
			status,
		};

		return this.countDocuments(query);
	}
}
