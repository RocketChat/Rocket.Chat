import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsKickProps = {
	roomId: string;
	userId: string;
};

const GroupsKickPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
		userId: {
			type: 'string',
		},
	},
	required: ['roomId', 'userId'],
	additionalProperties: false,
};

export const isGroupsKickProps = ajv.compile<GroupsKickProps>(GroupsKickPropsSchema);
