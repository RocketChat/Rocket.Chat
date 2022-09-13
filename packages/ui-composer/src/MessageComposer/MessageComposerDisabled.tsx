import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposerDisabled = ({ height = 'x48', ...props }: ComponentProps<typeof Box>): ReactElement => (
	<Box backgroundColor='neutral-200' display='flex' alignItems='center' height={height} justifyContent='center' {...props} />
);

export default MessageComposerDisabled;
