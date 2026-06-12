import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerToolbar = (props: ComponentProps<typeof Box>) => (
	<Box backgroundColor='surface-neutral' p={4} display='flex' justifyContent='space-between' w='full' {...props} />
);

export default MessageComposerToolbar;
