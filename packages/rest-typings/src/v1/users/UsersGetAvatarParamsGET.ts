import type { IUser } from '@rocket.chat/core-typings';

import { ajv } from '../Ajv';

export type UsersGetAvatarParamsGET = {
    userId?: IUser['_id'];
    username?: IUser['username'];
    user?: string;
};

const UsersGetAvatarParamsGetSchema = {
    type: 'object',
    properties: {
        userId: {
            type: 'string',
            nullable: true,
        },
        username: {
            type: 'string',
            nullable: true,
        },
        user: {
            type: 'string',
            nullable: true,
        }
    },
    required: [],
    additionalProperties: false,
};

export const isUsersGetAvatarProps = ajv.compile<UsersGetAvatarParamsGET>(UsersGetAvatarParamsGetSchema);
