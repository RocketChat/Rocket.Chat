import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, HTMLAttributes, ReactElement } from 'react';
import { forwardRef } from 'react';

import MessageComposer from '../MessageComposer/MessageComposer';

const MessageComposerDisabled = forwardRef<HTMLElement, ComponentProps<typeof MessageComposer>>(
	(props: Omit<HTMLAttributes<HTMLElement>, 'is'>, ref): ReactElement => (
		<MessageComposer ref={ref}>
			<Box pi='x8' backgroundColor='neutral-200' display='flex' alignItems='center' minHeight='x48' justifyContent='center' {...props} />
		</MessageComposer>
	),
);

export default MessageComposerDisabled;
