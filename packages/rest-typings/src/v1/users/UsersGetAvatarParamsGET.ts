import type { IUser } from '@rocket.chat/core-typings';

export type UsersGetAvatarParamsGET =
    | { userId: string; username?: never; user?: never }
    | { username: string; userId?: never; user?: never }
    | { user: string; userId?: never; username?: never };
