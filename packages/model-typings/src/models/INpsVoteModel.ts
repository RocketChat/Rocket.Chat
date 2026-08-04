import type { INpsVote, INpsVoteStatus } from '@rocket.chat/core-typings';
import type { Document, FindCursor, UpdateResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface INpsVoteModel extends IBaseModel<INpsVote> {
	findNotSentByNpsId<T extends Document = INpsVote, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		npsId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByNpsIdAndStatus<T extends Document = INpsVote, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		npsId: string,
		status: INpsVoteStatus,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByNpsId<T extends Document = INpsVote, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		npsId: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	save(vote: Omit<INpsVote, '_id' | '_updatedAt'>): Promise<UpdateResult>;
	updateVotesToSent(voteIds: string[]): Promise<UpdateResult | Document>;
	updateOldSendingToNewByNpsId(npsId: string): Promise<UpdateResult | Document>;
	countByNpsId(npsId: string): Promise<number>;
	countByNpsIdAndStatus(npsId: string, status: INpsVoteStatus): Promise<number>;
}
