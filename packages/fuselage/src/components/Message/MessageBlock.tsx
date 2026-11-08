import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type MessageBlockProps = ElementProps<HTMLDivElement> & {
	fixedWidth?: boolean;
};

function MessageBlock({ fixedWidth, ...props }: MessageBlockProps) {
	return <Box rcx-message-block rcx-message-block--width-fixed={fixedWidth} {...props} />;
}

export default MessageBlock;
