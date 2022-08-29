import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';

const MessageComposer = (props: ComponentProps<typeof Box>): ReactElement => (
	<Box borderWidth={2} borderColor='neutral-500' borderRadius='x4' display='flex' flexDirection='column' {...props} />
);

export default MessageComposer;
