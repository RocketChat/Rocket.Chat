import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsInviteProps = WithUserId;
export const isGroupsInviteProps = withUserIdProps;
