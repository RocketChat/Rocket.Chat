import type { Cursor, FindOneOptions, UpdateWriteOpResult, WithoutProjection } from 'mongodb';
import type { INpsVote, INpsVoteStatus } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface INpsVoteModel extends IBaseModel<INpsVote> {
	findNotSentByNpsId(npsId: string, options?: WithoutProjection<FindOneOptions<INpsVote>>): Cursor<INpsVote>;
	findByNpsIdAndStatus(npsId: string, status: INpsVoteStatus, options?: WithoutProjection<FindOneOptions<INpsVote>>): Cursor<INpsVote>;
	findByNpsId(npsId: string, options?: WithoutProjection<FindOneOptions<INpsVote>>): Cursor<INpsVote>;
	save(vote: Omit<INpsVote, '_id' | '_updatedAt'>): Promise<UpdateWriteOpResult>;
	updateVotesToSent(voteIds: string[]): Promise<UpdateWriteOpResult>;
	updateOldSendingToNewByNpsId(npsId: string): Promise<UpdateWriteOpResult>;
}
