import type { RefAttributes } from 'react';

import { Box, type BoxProps } from '../Box';

export type MessageBlockProps = Omit<BoxProps, 'ref'> &
	RefAttributes<HTMLDivElement> & {
		fixedWidth?: boolean;
	};

function MessageBlock({ className: _className, fixedWidth, ...props }: MessageBlockProps) {
	return <Box rcx-message-block rcx-message-block--width-fixed={fixedWidth} {...props} />;
}

export default MessageBlock;
