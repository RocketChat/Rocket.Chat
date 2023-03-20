import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsRemoveLeaderProps = WithUserId;
export const isGroupsRemoveLeaderProps = withUserIdProps;
