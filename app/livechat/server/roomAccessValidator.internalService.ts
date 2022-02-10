import { IUser } from '../../../definition/IUser';
import { IAuthorizationLivechat } from '../../../server/sdk/types/IAuthorizationLivechat';
import { ServiceClassInternal } from '../../../server/sdk/types/ServiceClass';
import { validators } from './roomAccessValidator.compatibility';
import type { IOmnichannelRoom } from '../../../definition/IRoom';

export class AuthorizationLivechat extends ServiceClassInternal implements IAuthorizationLivechat {
	protected name = 'authorization-livechat';

	protected internal = true;

	async canAccessRoom(room: IOmnichannelRoom, user: Pick<IUser, '_id'>, extraData?: object): Promise<boolean> {
		for (const validator of validators) {
			if (validator(room, user, extraData)) {
				return true;
			}
		}

		return false;
	}
}
