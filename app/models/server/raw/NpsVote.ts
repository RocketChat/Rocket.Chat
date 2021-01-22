import { Collection, Cursor, FindOneOptions, UpdateWriteOpResult } from 'mongodb';

import { INpsVote, INpsVoteStatus } from '../../../../definition/INps';
import { BaseRaw } from './BaseRaw';

type T = INpsVote;
export class NpsVoteRaw extends BaseRaw<T> {
	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		super(col, trash);

		this.col.createIndexes([
			{ key: { npsId: 1, status: 1, sentAt: 1 } },
		]);
	}

	findNotSentByNpsId(npsId: string, options?: FindOneOptions<T>): Cursor<T> {
		const query = {
			npsId,
			status: INpsVoteStatus.NEW,
		};
		return this.col
			.find(query, options)
			.sort({ ts: 1 })
			.limit(1000);
	}

	findOneNotSentByNpsId(npsId: string, options?: FindOneOptions<T>): Promise<T | null> {
		const query = {
			npsId,
			status: INpsVoteStatus.NEW,
		};
		return this.col.findOne(query, options);
	}

	findByNpsId(npsId: string, options?: FindOneOptions<T>): Cursor<T> {
		const query = {
			npsId,
		};
		return this.col.find(query, options);
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
				sentAt: 1 as 1, // TODO why?
			},
		};
		return this.col.updateMany(query, update);
	}
}
