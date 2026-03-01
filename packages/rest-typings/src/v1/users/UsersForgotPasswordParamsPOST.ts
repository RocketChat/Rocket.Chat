import { ajv } from '../Ajv';

export type UsersForgotPasswordParamsPOST = {
    email: string;
};

const UsersForgotPasswordParamsPostSchema = {
    type: 'object',
    properties: {
        email: {
            type: 'string',
        }
    },
    required: ['email'],
    additionalProperties: false,
};

export const isUsersForgotPasswordProps = ajv.compile<UsersForgotPasswordParamsPOST>(UsersForgotPasswordParamsPostSchema);
