import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsDeleteProps = {
	roomId: string;
};

const GroupsDeletePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsDeleteProps = ajv.compile<GroupsDeleteProps>(GroupsDeletePropsSchema);
