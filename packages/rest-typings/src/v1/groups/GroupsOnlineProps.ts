import { ajv } from './../Ajv';
export type GroupsOnlineProps = { _id?: string; query?: Record<string, any> };

const groupsOnlinePropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
			nullable: true,
		},
		query: {
			type: 'string',
			nullable: true,
		},
	},
	required: [],
	additionalProperties: false,
};

export const isGroupsOnlineProps = ajv.compile<GroupsOnlineProps>(groupsOnlinePropsSchema);
