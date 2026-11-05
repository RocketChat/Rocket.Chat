import type { WithUserId } from './BaseProps.js';
import { withUserIdProps } from './BaseProps.js';

export type GroupsInviteProps = WithUserId;
export const isGroupsInviteProps = withUserIdProps;
