import type { IUser } from '@rocket.chat/core-typings';

export type UsersGetAvatarParamsGET = {
    userId?: IUser['_id'];
    username?: IUser['username'];
    user?: string;
};
