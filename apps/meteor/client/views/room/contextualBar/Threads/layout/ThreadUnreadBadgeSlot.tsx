import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ThreadUnreadBadgeSlotProps = {
	children: ReactNode;
};

/**
 * The place of a thread's unread badge, under the follow button in the row's fixed column.
 */
const ThreadUnreadBadgeSlot = ({ children }: ThreadUnreadBadgeSlotProps) => <Box marginBlockStart='x24'>{children}</Box>;

export default ThreadUnreadBadgeSlot;
