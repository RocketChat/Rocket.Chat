import { Box } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

const MessageComposer = forwardRef<
	HTMLElement,
	Omit<HTMLAttributes<HTMLElement>, 'is'> & {
		children: ReactNode;
	}
>(
	(props, ref): ReactElement => (
		<Box ref={ref} borderWidth={2} borderColor='neutral-500' borderRadius='x4' display='flex' flexDirection='column' {...props} />
	),
);

export default MessageComposer;
