import type { WithUserId } from './BaseProps.js';
import { withUserIdProps } from './BaseProps.js';

export type GroupsRemoveLeaderProps = WithUserId;
export const isGroupsRemoveLeaderProps = withUserIdProps;
