import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IUser } from '@rocket.chat/core-typings';

export interface IAuthorizationLivechat {
	canAccessRoom: (room: IOmnichannelRoom, user: Pick<IUser, '_id'>, extraData?: Record<string, any>) => Promise<boolean>;
}
