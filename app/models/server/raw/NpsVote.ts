import { Collection, Cursor, FindOneOptions } from 'mongodb';

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
			{ key: { npsId: 1, status: 1 } },
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
}
