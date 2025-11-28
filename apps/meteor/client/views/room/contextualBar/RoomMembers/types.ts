import type { IUser, IRole, SubscriptionStatus, UserStatus } from '@rocket.chat/core-typings';

export type RoomMemberUser = Pick<IUser, 'username' | '_id' | 'name' | 'freeSwitchExtension' | 'federated'> & {
	roles?: IRole['_id'][];
	status?: UserStatus | SubscriptionStatus;
};
