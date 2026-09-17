import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerFileGroup = ({ children, style, ...props }: ComponentProps<typeof Box>) => {
	return (
		<Box
			role='group'
			display='flex'
			width='100%'
			flexDirection='row'
			paddingInline={8}
			paddingBlockEnd={8}
			paddingBlockStart={2}
			overflowX='auto'
			style={{ whiteSpace: 'nowrap', ...style }}
			{...props}
		>
			{children}
		</Box>
	);
};

export default MessageComposerFileGroup;
