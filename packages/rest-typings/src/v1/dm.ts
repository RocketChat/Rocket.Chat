import type { IRoom, IUser } from '@rocket.chat/core-typings';
import Ajv from 'ajv';

const ajv = new Ajv();

type DmCreateProps =
	| {
			username: Exclude<IUser['username'], undefined>;
	  }
	| {
			usernames: string[];
	  };

const DmCreatePropsSchema = {
	oneOf: [
		{
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				usernames: {
					type: 'array',
					items: { type: 'string' },
				},
			},
			required: ['usernames'],
			additionalProperties: false,
		},
	],
};

export const isDmCreateProps = ajv.compile(DmCreatePropsSchema);

export type DmEndpoints = {
	'dm.create': {
		POST: (
			params: DmCreateProps & {
				excludeSelf?: boolean;
			},
		) => {
			room: IRoom & { rid: IRoom['_id'] };
		};
	};
};
