import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type DmCloseProps =
	| {
			roomId: string;
	  }
	| { roomName: string };

const DmClosePropsSchema = {
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
				roomName: {
					type: 'string',
				},
			},
			required: ['roomName'],
			additionalProperties: false,
		},
	],
};

export const isDmCloseProps = ajv.compile<DmCloseProps>(DmClosePropsSchema);
