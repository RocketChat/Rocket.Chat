import Ajv from 'ajv';

const ajv = new Ajv();

export type DmMemberExistsProps = { roomId: string; username: string };

const dmMemberExistsPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		username: {
			type: 'string',
		},
	},
	required: ['roomId', 'username'],
	additionalProperties: false,
};

export const isDmMemberExistsProps = ajv.compile<DmMemberExistsProps>(dmMemberExistsPropsSchema);
