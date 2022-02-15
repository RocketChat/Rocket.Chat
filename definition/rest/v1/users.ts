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

export type UsersEndpoints = {
	'users.2fa.sendEmailCode': {
		POST: (params: users2faSendEmailCodeProps) => void;
	};
	'users.autocomplete': {
		GET: (params: { selector: string }) => { items: IUser[] };
	};
	'users.listTeams': {
		GET: (params: { userId: IUser['_id'] }) => { teams: Array<ITeam> };
	};
};
