import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

const MessageComposerFileGroup = ({ children, style, ...props }: ComponentProps<typeof Box>) => {
	return (
		<Box
			role='group'
			display='flex'
			width='100%'
			flexDirection='row'
			pi={8}
			pbe={8}
			pbs={2}
			overflowX='auto'
			style={{ whiteSpace: 'nowrap', ...style }}
			{...props}
		>
			{children}
		</Box>
	);
};

export default MessageComposerFileGroup;
