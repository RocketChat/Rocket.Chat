import type { WithUserId } from './BaseProps';
import { withUserIdProps } from './BaseProps';

export type GroupsAddOwnerProps = WithUserId;
export const isGroupsAddOwnerProps = withUserIdProps;
