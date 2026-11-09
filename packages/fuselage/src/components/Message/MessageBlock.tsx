import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type MessageBlockProps = ElementProps<HTMLDivElement> & {
	fixedWidth?: boolean;
};

function MessageBlock({ fixedWidth, ...props }: MessageBlockProps) {
	return <Box rcx-message-block rcx-message-block--width-fixed={fixedWidth} {...props} />;
}

export default MessageBlock;
