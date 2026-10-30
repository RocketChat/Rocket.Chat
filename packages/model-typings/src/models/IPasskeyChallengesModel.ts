import type { IPasskeyChallenge, IUser } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IPasskeyChallengesModel extends IBaseModel<IPasskeyChallenge> {
	createChallenge(
		challenge: { challenge: IPasskeyChallenge['_id']; expireAt: IPasskeyChallenge['expireAt'] } & (
			{ purpose: 'registration'; userId: IUser['_id'] } | { purpose: 'authentication' }
		),
	): Promise<void>;

	findOneNotExpiredForAuthenticationAndDelete(challenge: IPasskeyChallenge['_id']): Promise<IPasskeyChallenge | null>;

	findOneNotExpiredForRegistrationByUserIdAndDelete(
		challenge: IPasskeyChallenge['_id'],
		userId: IUser['_id'],
	): Promise<IPasskeyChallenge | null>;
}
