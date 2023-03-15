import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsLeaveProps = {
	roomId: string;
};

const GroupsLeavePropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsLeaveProps = ajv.compile<GroupsLeaveProps>(GroupsLeavePropsSchema);
