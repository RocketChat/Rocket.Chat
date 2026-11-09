import { Box } from '@rocket.chat/fuselage';
import type { ReactNode, Ref } from 'react';

export type MessageListSectionProps = {
	ref?: Ref<HTMLElement>;
	children: ReactNode;
};

/**
 * The section holding a contextual bar's virtualized message list, filling the height the panel leaves it.
 */
const MessageListSection = (props: MessageListSectionProps) => (
	<Box is='section' display='flex' flexDirection='column' flexGrow={1} flexShrink={1} flexBasis='auto' height='full' {...props} />
);

export default MessageListSection;
