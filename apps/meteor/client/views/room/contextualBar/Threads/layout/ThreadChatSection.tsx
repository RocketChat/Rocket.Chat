import { Box } from '@rocket.chat/fuselage';
import type { DragEvent, ReactNode } from 'react';

export type ThreadChatSectionProps = {
	children: ReactNode;
	onDragEnter?: (event: DragEvent<Element>) => void;
	onDragLeave?: (event: DragEvent<Element>) => void;
};

/**
 * The thread's messages above its composer, filling the height the panel leaves them. It is the drop target for files
 * because the panel around it takes no handlers of its own.
 */
const ThreadChatSection = ({ children, onDragEnter, onDragLeave }: ThreadChatSectionProps) => (
	<Box
		is='section'
		position='relative'
		display='flex'
		flexDirection='column'
		flexGrow={1}
		flexShrink={1}
		flexBasis='auto'
		height='full'
		onDragEnter={onDragEnter}
		onDragLeave={onDragLeave}
	>
		{children}
	</Box>
);

export default ThreadChatSection;
