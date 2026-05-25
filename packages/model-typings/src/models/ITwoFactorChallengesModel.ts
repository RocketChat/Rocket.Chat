import type { ITwoFactorChallenge } from '@rocket.chat/core-typings';
import type { DeleteResult, FindOptions } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface ITwoFactorChallengesModel extends IBaseModel<ITwoFactorChallenge> {
	findOneByPendingChallengeId(id: string, options?: FindOptions<ITwoFactorChallenge>): Promise<ITwoFactorChallenge | null>;
	removeByPendingChallengeId(id: string): Promise<DeleteResult>;
	createTwoFactorChallenge(userId: string, method: ITwoFactorChallenge['method']): Promise<string>;
}
