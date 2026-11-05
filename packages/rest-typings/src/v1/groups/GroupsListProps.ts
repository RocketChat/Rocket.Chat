import type { PaginatedRequest } from '../../helpers/PaginatedRequest.js';
import { ajv } from '../Ajv.js';

export type GroupsListProps = PaginatedRequest<null>;
const groupsListPropsSchema = {};
export const isGroupsListProps = ajv.compile<GroupsListProps>(groupsListPropsSchema);
