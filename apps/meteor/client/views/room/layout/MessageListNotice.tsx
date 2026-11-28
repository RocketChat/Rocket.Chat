import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MessageListNoticeProps = {
	children: ReactNode;
};

/**
 * A notice about the room's messages, centred across the message list.
 */
const MessageListNotice = ({ children }: MessageListNoticeProps) => (
	<Box display='flex' justifyContent='center' paddingInline='x20' marginBlock='x8'>
		{children}
	</Box>
);

export default MessageListNotice;
