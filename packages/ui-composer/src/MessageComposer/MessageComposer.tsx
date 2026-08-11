import { Box } from '@rocket.chat/fuselage';
import type { ElementType, HTMLAttributes, ReactNode, RefAttributes } from 'react';

export type MessageComposerProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	children: ReactNode;
	is?: ElementType<any>;
	variant?: 'default' | 'error' | 'editing';
} & RefAttributes<HTMLElement>;

const MessageComposer = ({ variant, ref, ...props }: MessageComposerProps) => {
	return (
		<Box
			rcx-input-box__wrapper
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
};

export default MessageComposer;
