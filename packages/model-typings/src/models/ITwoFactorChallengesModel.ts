import type { ITwoFactorChallenge } from '@rocket.chat/core-typings';
import type { DeleteResult, Document } from 'mongodb';

import type { IBaseModel } from './IBaseModel';
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ITwoFactorChallengesModel extends IBaseModel<ITwoFactorChallenge> {
	findOneByPendingChallengeId<
		T extends Document = ITwoFactorChallenge,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		id: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
	removeByPendingChallengeId(id: string): Promise<DeleteResult>;
	createTwoFactorChallenge(userId: string, method: ITwoFactorChallenge['method']): Promise<string>;
}
