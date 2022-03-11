import Ajv, { JSONSchemaType } from 'ajv';

import type { ITeam } from '../../ITeam';
import type { IUser } from '../../IUser';

const ajv = new Ajv();

type users2faSendEmailCodeProps = {
	emailOrUsername: string;
};

const users2faSendEmailCodePropsSchema: JSONSchemaType<users2faSendEmailCodeProps> = {
	type: 'object',
	properties: {
		emailOrUsername: {
			type: 'string',
		},
	},
	required: ['emailOrUsername'],
	additionalProperties: false,
};

export const isUsers2faSendEmailCode = ajv.compile(users2faSendEmailCodePropsSchema);

type UsersAutocomplete = {
	selector: string;
};

const UsersAutocompleteSchema: JSONSchemaType<UsersAutocomplete> = {
	type: 'object',
	properties: {
		selector: {
			type: 'string',
		},
	},
	required: ['selector'],
	additionalProperties: false,
};

export const isUsersAutocomplete = ajv.compile(UsersAutocompleteSchema);

type UsersListTeams = {
	userId: IUser['_id'];
};

const UsersListTeamsSchema: JSONSchemaType<UsersListTeams> = {
	type: 'object',
	properties: {
		userId: {
			type: 'string',
		},
	},
	required: ['userId'],
	additionalProperties: false,
};

export const isUsersListTeams = ajv.compile(UsersListTeamsSchema);

export type UsersEndpoints = {
	'users.2fa.sendEmailCode': {
		POST: (params: users2faSendEmailCodeProps) => void;
	};
	'users.autocomplete': {
		GET: (params: UsersAutocomplete) => { items: IUser[] };
	};
	'users.listTeams': {
		GET: (params: UsersListTeams) => { teams: Array<ITeam> };
	};
};
