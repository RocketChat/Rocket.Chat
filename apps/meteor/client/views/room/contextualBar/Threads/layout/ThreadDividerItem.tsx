import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

export type ThreadDividerItemProps = {
	'ref'?: Ref<HTMLElement>;
	'data-id'?: unknown;
	'data-time'?: string;
	'children': ReactNode;
};

/**
 * The list item that holds a day or unread divider among the thread's messages.
 */
const ThreadDividerItem = (props: ThreadDividerItemProps) => <Box role='listitem' {...props} />;

export default ThreadDividerItem;
