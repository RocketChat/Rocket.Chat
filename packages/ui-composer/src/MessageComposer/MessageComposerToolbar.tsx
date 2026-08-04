import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

const MessageComposerToolbar = (props: BoxProps) => (
	<Box backgroundColor='surface-neutral' padding={4} display='flex' justifyContent='space-between' width='full' {...props} />
);

export default MessageComposerToolbar;
