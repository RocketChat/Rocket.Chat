import { Collection, ObjectId } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { INpsVote } from '../../../../definition/INpsVote';

export class NpsVoteRaw extends BaseRaw<INpsVote> {
	public readonly col!: Collection<INpsVote>;

	async insertOne(data: Omit<INpsVote, '_id'>): Promise<any> {
		return this.col.insertOne({
			_id: new ObjectId().toHexString(),
			...data,
		});
	}
}
