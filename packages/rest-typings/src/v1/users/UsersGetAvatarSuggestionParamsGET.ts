// TO-DO: import Ajv instance instead of creating a new one
import Ajv from 'ajv';

const ajv = new Ajv({ coerceTypes: true });

export type UsersGetAvatarSuggestionParamsGET = {};

const UsersGetAvatarSuggestionParamsGETSchema = {
	type: 'object',
	properties: {},
	required: [],
	additionalProperties: false,
};

export const isUsersGetAvatarSuggestionParamsGET = ajv.compile<UsersGetAvatarSuggestionParamsGET>(UsersGetAvatarSuggestionParamsGETSchema);
