import type { IOmnichannelRoom } from '../../../definition/IRoom';
import type { IUser } from '../../../definition/IUser';

export interface IAuthorizationLivechat {
	canAccessRoom: (room: IOmnichannelRoom, user: Pick<IUser, '_id'>, extraData?: Record<string, any>) => Promise<boolean>;
}
