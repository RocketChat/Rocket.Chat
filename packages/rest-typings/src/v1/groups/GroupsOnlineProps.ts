import Ajv from 'ajv';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsOnlineProps = { query?: Record<string, any> };
const groupsOnlyPropsSchema = {
	type: 'object',
	properties: {
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};
export const isGroupsOnlineProps = ajv.compile<GroupsOnlineProps>(groupsOnlyPropsSchema);
