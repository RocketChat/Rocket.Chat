import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type ThreadChatSectionProps = {
	children: ReactNode;
};

/**
 * The thread's messages above its composer, filling the height the panel leaves them.
 */
const ThreadChatSection = ({ children }: ThreadChatSectionProps) => (
	<Box is='section' position='relative' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
		{children}
	</Box>
);

export default ThreadChatSection;
