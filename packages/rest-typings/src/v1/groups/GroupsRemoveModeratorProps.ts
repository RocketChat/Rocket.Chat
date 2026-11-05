import type { WithUserId } from './BaseProps.js';
import { withUserIdProps } from './BaseProps.js';

export type GroupsRemoveModeratorProps = WithUserId;
export const isGroupsRemoveModeratorProps = withUserIdProps;
