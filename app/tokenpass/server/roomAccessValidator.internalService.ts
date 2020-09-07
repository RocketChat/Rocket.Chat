import { ServiceClass } from '../../../server/sdk/types/ServiceClass';
import { validators } from './roomAccessValidator.compatibility';
import { RoomAccessValidator } from '../../../server/sdk/types/IAuthorization';
import { api } from '../../../server/sdk/api';
import { IAuthorizationTokenpass } from '../../../server/sdk/types/IAuthorizationTokenpass';

class AuthorizationTokenpass extends ServiceClass implements IAuthorizationTokenpass {
	protected name = 'authorization.livechat';

	canAccessRoom: RoomAccessValidator = async (room, user): Promise<boolean> => {
		for (const validator of validators) {
			if (validator(room, user)) {
				return true;
			}
		}

		return false;
	}
}

api.registerService(new AuthorizationTokenpass());
