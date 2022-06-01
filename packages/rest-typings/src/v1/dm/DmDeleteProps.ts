import Ajv from 'ajv';

const ajv = new Ajv();

export type DmDeleteProps =
	| {
			roomId: string;
	  }
	| {
			username: string;
	  };

export const isDmDeleteProps = ajv.compile<DmDeleteProps>({
	oneOf: [
		{
			type: 'object',
			properties: {
				roomId: {
					type: 'string',
				},
			},
			required: ['roomId'],
			additionalProperties: false,
		},
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
	],
});
