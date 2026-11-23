import type { WithUserId } from './BaseProps.js';
import { withUserIdProps } from './BaseProps.js';

export type GroupsAddModeratorProps = WithUserId;
export const isGroupsAddModeratorProps = withUserIdProps;
