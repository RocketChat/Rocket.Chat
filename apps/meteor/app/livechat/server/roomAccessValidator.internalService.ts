import type { IAuthorizationLivechat } from '@rocket.chat/core-services';
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IUser, IOmnichannelRoom } from '@rocket.chat/core-typings';

import { validators } from './roomAccessValidator.compatibility';

export class AuthorizationLivechat extends ServiceClassInternal implements IAuthorizationLivechat {
	protected name = 'authorization-livechat';

	protected internal = true;

	async canAccessRoom(room: IOmnichannelRoom, user?: Pick<IUser, '_id'>, extraData?: object): Promise<boolean> {
		for await (const validator of validators) {
			if (await validator(room, user, extraData)) {
				return true;
			}
		}

		return false;
	}
}
