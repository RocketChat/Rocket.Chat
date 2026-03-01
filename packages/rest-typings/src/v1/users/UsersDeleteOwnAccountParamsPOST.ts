import { ajv } from '../Ajv';

export type UsersDeleteOwnAccountParamsPOST = {
    password: string;
    confirmRelinquish?: boolean;
};

const UsersDeleteOwnAccountParamsPostSchema = {
    type: 'object',
    properties: {
        password: {
            type: 'string',
        },
        confirmRelinquish: {
            type: 'boolean',
            nullable: true,
        }
    },
    required: ['password'],
    additionalProperties: false,
};

export const isUsersDeleteOwnAccountProps = ajv.compile<UsersDeleteOwnAccountParamsPOST>(UsersDeleteOwnAccountParamsPostSchema);
