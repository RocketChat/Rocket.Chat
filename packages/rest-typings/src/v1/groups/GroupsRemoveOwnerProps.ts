import type { WithUserId } from './BaseProps.js';
import { withUserIdProps } from './BaseProps.js';

export type GroupsRemoveOwnerProps = WithUserId;
export const isGroupsRemoveOwnerProps = withUserIdProps;
