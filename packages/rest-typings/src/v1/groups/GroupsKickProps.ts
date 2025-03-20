import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsKickProps = WithUserId;
export const isGroupsKickProps = withUserIdProps;
