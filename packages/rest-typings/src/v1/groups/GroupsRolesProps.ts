import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsRolesProps = {
	roomId: string;
};

const GroupsRolesPropsSchema = {
	type: 'object',
	properties: {
		roomId: {
			type: 'string',
		},
	},
	required: ['roomId'],
	additionalProperties: false,
};

export const isGroupsRolesProps = ajv.compile<GroupsRolesProps>(GroupsRolesPropsSchema);
