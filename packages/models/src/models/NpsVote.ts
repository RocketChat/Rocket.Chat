import type { INpsVote, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { INpsVoteStatus } from '@rocket.chat/core-typings';
import type { INpsVoteModel, DocumentWithProjection, FindOptionsWithProjection } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, Document, IndexDescription, UpdateResult } from 'mongodb';
import { ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class NpsVoteRaw extends BaseRaw<INpsVote> implements INpsVoteModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<INpsVote>>) {
		super(db, 'nps_vote', trash);
	}

	override modelIndexes(): IndexDescription[] {
		return [{ key: { npsId: 1, status: 1, sentAt: 1 } }, { key: { npsId: 1, identifier: 1 }, unique: true }];
	}

	// `sort` and `limit` are branded away because the cursor below overwrites both; a caller passing
	// them would have them silently dropped
	findNotSentByNpsId<T extends Document = INpsVote, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		npsId: string,
		options?: O & { sort?: never; limit?: never },
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			npsId,
			status: INpsVoteStatus.NEW,
		};
		const cursor = options ? this.find<T, O>(query, options) : this.find<T, O>(query);

		return cursor.sort({ ts: 1 }).limit(1000);
	}

	findByNpsIdAndStatus<T extends Document = INpsVote, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		npsId: string,
		status: INpsVoteStatus,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			npsId,
			status,
		};
		if (options) {
			return this.find<T, O>(query, options);
		}
		return this.find<T, O>(query);
	}

	findByNpsId<T extends Document = INpsVote, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		npsId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>> {
		const query = {
			npsId,
		};
		if (options) {
			return this.find<T, O>(query, options);
		}
		return this.find<T, O>(query);
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
