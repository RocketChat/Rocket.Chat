import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsCloseProps = {
	roomId: string;
};

const GroupsClosePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsCloseProps = ajv.compile<GroupsCloseProps>(GroupsClosePropsSchema);
