import { INpsVote, INpsVoteStatus, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { INpsVoteModel } from '@rocket.chat/model-typings';
import type { Collection, Cursor, Db, FindOneOptions, IndexSpecification, UpdateWriteOpResult, WithoutProjection } from 'mongodb';
import { getCollectionName } from '@rocket.chat/models';
import { ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class NpsVoteRaw extends BaseRaw<INpsVote> implements INpsVoteModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<INpsVote>>) {
		super(db, getCollectionName('nps_vote'), trash);
	}

	modelIndexes(): IndexSpecification[] {
		return [{ key: { npsId: 1, status: 1, sentAt: 1 } }, { key: { npsId: 1, identifier: 1 }, unique: true }];
	}

	findNotSentByNpsId(npsId: string, options?: WithoutProjection<FindOneOptions<INpsVote>>): Cursor<INpsVote> {
		const query = {
			npsId,
			status: INpsVoteStatus.NEW,
		};
		return this.col.find(query, options).sort({ ts: 1 }).limit(1000);
	}

	findByNpsIdAndStatus(npsId: string, status: INpsVoteStatus, options?: WithoutProjection<FindOneOptions<INpsVote>>): Cursor<INpsVote> {
		const query = {
			npsId,
			status,
		};
		return this.col.find(query, options);
	}

	findByNpsId(npsId: string, options?: WithoutProjection<FindOneOptions<INpsVote>>): Cursor<INpsVote> {
		const query = {
			npsId,
		};
		return this.col.find(query, options);
	}

	save(vote: Omit<INpsVote, '_id' | '_updatedAt'>): Promise<UpdateWriteOpResult> {
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
				_id: new ObjectId().toHexString(),
			},
		};

		return this.col.updateOne(query, update, { upsert: true });
	}

	updateVotesToSent(voteIds: string[]): Promise<UpdateWriteOpResult> {
		const query = {
			_id: { $in: voteIds },
		};
		const update = {
			$set: {
				status: INpsVoteStatus.SENT,
			},
		};
		return this.col.updateMany(query, update);
	}

	updateOldSendingToNewByNpsId(npsId: string): Promise<UpdateWriteOpResult> {
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
				sentAt: 1 as 1, // why do you do this to me TypeScript?
			},
		};
		return this.col.updateMany(query, update);
	}
}
