import { ajv } from '../../helpers/schemas';
import type { PaginatedRequest } from '../../helpers/PaginatedRequest';

export type GroupsListProps = PaginatedRequest<null>;
const groupsListPropsSchema = {};
export const isGroupsListProps = ajv.compile<GroupsListProps>(groupsListPropsSchema);
