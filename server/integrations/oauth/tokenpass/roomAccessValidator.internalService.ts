import { ServiceClass } from '../../../sdk/types/ServiceClass';
import { validators } from './roomAccessValidator.compatibility';
import { api } from '../../../sdk/api';
import { IAuthorizationTokenpass } from '../../../sdk/types/IAuthorizationTokenpass';
import { IRoom } from '../../../../definition/IRoom';
import { IUser } from '../../../../definition/IUser';

class AuthorizationTokenpass extends ServiceClass implements IAuthorizationTokenpass {
	protected name = 'authorization-tokenpass';

	protected internal = true;

	async canAccessRoom(room: Partial<IRoom>, user: Partial<IUser>): Promise<boolean> {
		for (const validator of validators) {
			if (validator(room, user)) {
				return true;
			}
		}

		return false;
	}
}

api.registerService(new AuthorizationTokenpass());
