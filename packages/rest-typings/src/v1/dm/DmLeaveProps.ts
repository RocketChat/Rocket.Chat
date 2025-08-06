import { ajv } from './../Ajv';
export type DmLeaveProps =
	| {
			roomId: string;
	  }
	| { roomName: string };

const DmLeavePropsSchema = {
	type: 'object',
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

export const isDmLeaveProps = ajv.compile<DmLeaveProps>(DmLeavePropsSchema);
