import { Box } from '@rocket.chat/fuselage';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

export type MessageComposerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	children: ReactNode;
	is?: ElementType<any>;
	variant?: 'default' | 'error' | 'editing';
};

const MessageComposer = forwardRef<HTMLElement, MessageComposerProps>(function MessageComposer({ variant, ...props }, ref) {
	return (
		<Box
			rcx-input-box__wrapper
			position='relative'
			flexGrow={1}
			minWidth='x144'
			borderWidth='default'
			borderRadius='medium'
			fontScale='p2m'
			marginBlockStart={2}
			backgroundColor={variant === 'editing' ? 'status-background-warning-2' : undefined}
			ref={ref}
			role='group'
			display='flex'
			flexDirection='column'
			overflow='hidden'
			padding={0}
			{...props}
		/>
	);
});

export default MessageComposer;
