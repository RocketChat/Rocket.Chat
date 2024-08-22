import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsAddModeratorProps = WithUserId;
export const isGroupsAddModeratorProps = withUserIdProps;
