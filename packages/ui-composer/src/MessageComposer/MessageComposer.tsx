import { Box } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

type MessageComposerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	children: ReactNode;
	is?: React.ElementType<any>;
	variant?: 'default' | 'error';
};

const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(
	(props, ref): ReactElement => (
		<Box ref={ref} role='group' borderWidth={2} borderColor='light' borderRadius='x4' display='flex' flexDirection='column' {...props} />
	),
);

export default MessageComposer;
