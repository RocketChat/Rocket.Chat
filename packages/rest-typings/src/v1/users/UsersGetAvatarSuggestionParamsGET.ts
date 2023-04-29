import { ajv } from '../../helpers/schemas';

export type UsersGetAvatarSuggestionParamsGET = {};

const UsersGetAvatarSuggestionParamsGETSchema = {
	type: 'object',
	properties: {},
	required: [],
	additionalProperties: false,
};

export const isUsersGetAvatarSuggestionParamsGET = ajv.compile<UsersGetAvatarSuggestionParamsGET>(UsersGetAvatarSuggestionParamsGETSchema);
