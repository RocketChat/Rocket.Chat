// TO-DO: import Ajv instance instead of creating a new one
import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type UsersGetAvatarSuggestionParamsGET = {
	userId: string;
};

const UsersGetAvatarSuggestionParamsGETSchema = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isUsersGetAvatarSuggestionParamsGET = ajv.compile<UsersGetAvatarSuggestionParamsGET>(UsersGetAvatarSuggestionParamsGETSchema);
