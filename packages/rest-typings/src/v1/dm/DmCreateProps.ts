import Ajv from 'ajv';

const ajv = new Ajv();

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
					enum: ['true', 'false'],
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
					enum: ['true', 'false'],
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
