import Ajv from 'ajv';

const ajv = new Ajv();

export type GroupsMemberExistsProps = { roomId: string; username: string };

const groupsMemberExistsPropsSchema = {
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

export const isGroupsMemberExistsProps = ajv.compile<GroupsMemberExistsProps>(groupsMemberExistsPropsSchema);
