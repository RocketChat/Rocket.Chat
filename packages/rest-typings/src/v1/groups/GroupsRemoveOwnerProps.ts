import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsRemoveOwnerProps = WithUserId;
export const isGroupsRemoveOwnerProps = withUserIdProps;
