import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';
import { Scrollable } from '../Scrollable/index.js';

export type ModalContentProps = ElementProps<HTMLDivElement> & {
	onScrollContent?: ((touching: { top: boolean }) => void) | undefined;
	/** Stretches the content to the modal's height and closes the modal itself, for content that brings its own footer. */
	fill?: boolean;
};

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
