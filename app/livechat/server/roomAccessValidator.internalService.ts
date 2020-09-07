import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import { IAuthorizationLivechat } from '../../../server/sdk/types/IAuthorizationLivechat';
import { validators } from './roomAccessValidator.compatibility';
import { RoomAccessValidator } from '../../../server/sdk/types/IAuthorization';
import { api } from '../../../server/sdk/api';

class AuthorizationLivechat extends ServiceClass implements IAuthorizationLivechat {
	protected name = 'authorization.livechat';

	canAccessRoom: RoomAccessValidator = async (room, user, extraData): Promise<boolean> => {
		for (const validator of validators) {
			if (validator(room, user, extraData)) {
				return true;
			}
		}

		return false;
	}
}

api.registerService(new AuthorizationLivechat());
