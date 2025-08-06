import { ajv } from '../Ajv';

export type UsersAutocompleteParamsGET = { selector: string };

const UsersAutocompleteParamsGetSchema = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isUsersAutocompleteProps = ajv.compile<UsersAutocompleteParamsGET>(UsersAutocompleteParamsGetSchema);
