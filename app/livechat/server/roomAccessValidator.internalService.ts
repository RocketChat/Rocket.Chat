import { ServiceClassInternal } from '../../../server/sdk/types/ServiceClass';
import { IAuthorizationLivechat } from '../../../server/sdk/types/IAuthorizationLivechat';
import { validators } from './roomAccessValidator.compatibility';
import { IRoom } from '../../../definition/IRoom';
import { IUser } from '../../../definition/IUser';

export class AuthorizationLivechat extends ServiceClassInternal implements IAuthorizationLivechat {
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
