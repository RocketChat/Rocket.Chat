import type { Document, FindCursor, FindOptions, UpdateResult } from 'mongodb';
import type { INpsVote, INpsVoteStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface INpsVoteModel extends IBaseModel<INpsVote> {
	findNotSentByNpsId(npsId: string, options?: FindOptions<INpsVote>): FindCursor<INpsVote>;
	findByNpsIdAndStatus(npsId: string, status: INpsVoteStatus, options?: FindOptions<INpsVote>): FindCursor<INpsVote>;
	findByNpsId(npsId: string, options?: FindOptions<INpsVote>): FindCursor<INpsVote>;
	save(vote: Omit<INpsVote, '_id' | '_updatedAt'>): Promise<UpdateResult>;
	updateVotesToSent(voteIds: string[]): Promise<UpdateResult | Document>;
	updateOldSendingToNewByNpsId(npsId: string): Promise<UpdateResult | Document>;
}
