import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type MessageComposerToolbarProps = BoxProps;

const MessageComposerToolbar = (props: MessageComposerToolbarProps) => (
	<Box backgroundColor='surface-neutral' padding={4} display='flex' justifyContent='space-between' width='full' {...props} />
);

export default MessageComposerToolbar;
