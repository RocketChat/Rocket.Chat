import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type MessageBlockProps = ElementProps<HTMLDivElement> & {
	/** Caps the block's width, so a preview or UI Kit content doesn't stretch across a wide room. */
	fixedWidth?: boolean;
};

/**
 * Content below a message's text, such as an attachment, a link preview, UI Kit blocks or the thread metrics.
 */
function MessageBlock({ fixedWidth, ...props }: MessageBlockProps) {
	return <Box rcx-message-block rcx-message-block--width-fixed={fixedWidth} {...props} />;
}

export default MessageBlock;
