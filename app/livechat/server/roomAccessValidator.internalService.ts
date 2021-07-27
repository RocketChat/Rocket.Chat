import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import { IAuthorizationLivechat } from '../../../server/sdk/types/IAuthorizationLivechat';
import { validators } from './roomAccessValidator.compatibility';
import { api } from '../../../server/sdk/api';
import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';

class AuthorizationLivechat extends ServiceClass implements IAuthorizationLivechat {
	protected name = 'authorization-livechat';

	protected internal = true;

	async canAccessRoom(room: Partial<IRoom>, user: Partial<IUser>, extraData?: object): Promise<boolean> {
		for (const validator of validators) {
			if (validator(room, user, extraData)) {
				return true;
			}
		}

		return false;
	}
}

api.registerService(new AuthorizationLivechat());
