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
					type: 'enum',
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
					type: 'enum',
				},
			},
			required: ['username'],
			additionalProperties: false,
		},
	],
});
