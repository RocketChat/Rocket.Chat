import type { IUser } from '@rocket.chat/core-typings';
import type { IOmnichannelRoom } from '@rocket.chat/omnichannel-typings';

export interface IAuthorizationLivechat {
	canAccessRoom: (room: IOmnichannelRoom, user?: Pick<IUser, '_id'>, extraData?: Record<string, any>) => Promise<boolean>;
}
