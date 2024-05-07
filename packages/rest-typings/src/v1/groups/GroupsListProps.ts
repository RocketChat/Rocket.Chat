import Ajv from 'ajv';

import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

const ajv = new Ajv({
	coerceTypes: true,
});

export type GroupsListProps = PaginatedRequest<null>;
const groupsListPropsSchema = {};
export const isGroupsListProps = ajv.compile<GroupsListProps>(groupsListPropsSchema);
