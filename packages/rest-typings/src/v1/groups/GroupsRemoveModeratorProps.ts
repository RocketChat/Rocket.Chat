import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsRemoveModeratorProps = WithUserId;
export const isGroupsRemoveModeratorProps = withUserIdProps;
