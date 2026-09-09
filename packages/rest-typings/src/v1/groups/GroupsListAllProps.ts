import type { PaginatedRequest } from '../../helpers/PaginatedRequest';
import { ajvQuery } from '../Ajv';

export type GroupsListAllProps = PaginatedRequest<{ customFields?: string }>;

const groupsListAllPropsSchema = {
	type: 'object',
	properties: {
		customFields: {
			type: 'string',
			minLength: 1,
		},
	},
};

export const isGroupsListAllProps = ajvQuery.compile<GroupsListAllProps>(groupsListAllPropsSchema);
