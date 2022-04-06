import { ServiceClassInternal } from '../../../server/sdk/types/ServiceClass';
import { validators } from './roomAccessValidator.compatibility';
import { IAuthorizationTokenpass } from '../../../server/sdk/types/IAuthorizationTokenpass';
import type { IRoom } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

export class AuthorizationTokenpass extends ServiceClassInternal implements IAuthorizationTokenpass {
	protected name = 'authorization-tokenpass';

	protected internal = true;

	async canAccessRoom(room: Pick<IRoom, '_id' | 't' | 'teamId' | 'prid' | 'tokenpass'>, user: Pick<IUser, '_id'>): Promise<boolean> {
		for (const validator of validators) {
			if (validator(room, user)) {
				return true;
			}
		}

		return false;
	}
}
