import { ajv } from '../../helpers/schemas';

export type DmCreateProps = (
	| {
			usernames: string;
	  }
	| {
			username: string;
	  }
) & { excludeSelf?: boolean };

export const isDmCreateProps = ajv.compile<DmCreateProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				usernames: {
					type: 'string',
				},
				excludeSelf: {
					type: 'boolean',
				},
			},
			required: ['usernames'],
			additionalProperties: false,
		},
		{
			type: 'object',
			properties: {
				username: {
					type: 'string',
				},
				excludeSelf: {
					type: 'boolean',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
