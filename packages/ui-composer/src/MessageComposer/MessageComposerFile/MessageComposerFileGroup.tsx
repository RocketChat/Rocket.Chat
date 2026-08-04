import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

const MessageComposerFileGroup = ({ children, style, ...props }: BoxProps) => {
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
