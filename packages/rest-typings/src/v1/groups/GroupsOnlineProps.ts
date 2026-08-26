import { ajvQuery } from '../Ajv';

export type GroupsOnlineProps = { _id: string };

const groupsOnlinePropsSchema = {
	type: 'object',
	properties: {
		_id: {
			type: 'string',
		},
	},
	required: ['_id'],
	additionalProperties: false,
};

export const isGroupsOnlineProps = ajvQuery.compile<GroupsOnlineProps>(groupsOnlinePropsSchema);
