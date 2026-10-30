import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type MessageSearchMessageListProps = { children: ReactNode };

const MessageSearchMessageList = ({ children }: MessageSearchMessageListProps) => (
	<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full'>
		{children}
	</Box>
);

export default MessageSearchMessageList;
