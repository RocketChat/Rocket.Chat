import { Box } from '@rocket.chat/fuselage';
import type { ElementType, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { forwardRef } from 'react';

type MessageComposerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	children: ReactNode;
	is?: ElementType<any>;
	variant?: 'default' | 'error' | 'editing';
};

const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(function MessageComposer({ variant, ...props }, ref): ReactElement {
	return (
		<Box
			rcx-input-box__wrapper
			mbs={2}
			bg={variant === 'editing' ? 'status-background-warning-2' : undefined}
			ref={ref}
			role='group'
			display='flex'
			flexDirection='column'
			overflow='hidden'
			p={0}
			{...props}
		/>
	);
});

export default MessageComposer;
