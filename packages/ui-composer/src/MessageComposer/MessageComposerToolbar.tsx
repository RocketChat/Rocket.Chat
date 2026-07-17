import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerToolbar = (props: ComponentProps<typeof Box>) => (
	<Box backgroundColor='surface-neutral' padding={4} display='flex' justifyContent='space-between' width='full' {...props} />
);

export default MessageComposerToolbar;
