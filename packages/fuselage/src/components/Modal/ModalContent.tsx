import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Scrollable } from '../Scrollable';

export type ModalContentProps = ElementProps<HTMLDivElement> & {
	/** Called when the scrolled content reaches or leaves an edge, with whether it is at the top. */
	onScrollContent?: ((touching: { top: boolean }) => void) | undefined;
	/** Stretches the content to the modal's height and closes the modal itself, for content that brings its own footer. */
	fill?: boolean;
};

/** The modal's main area, which scrolls when it is taller than the modal allows. */
const ModalContent = ({ children, onScrollContent, fill, ...props }: ModalContentProps) => (
	<Scrollable vertical onScrollContent={onScrollContent}>
		<Box rcx-modal__content>
			<Box rcx-modal__content-wrapper rcx-modal__content-wrapper--fill={fill} {...props}>
				{children}
			</Box>
		</Box>
	</Scrollable>
);

export default ModalContent;
