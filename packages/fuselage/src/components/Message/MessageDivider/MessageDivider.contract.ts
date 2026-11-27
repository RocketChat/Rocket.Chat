import type { ReactNode } from 'react';

import type { ActionContract } from '../../../types/Attributes.contract';

export type MessageDividerContract = ActionContract & {
	/** What the divider announces between two messages, such as a date. */
	children?: ReactNode;
	/** Marks where the unread messages start, with this label at the end of the line. */
	unreadLabel?: string;
};
