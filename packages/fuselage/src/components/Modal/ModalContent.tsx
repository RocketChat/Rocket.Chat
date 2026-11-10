import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Scrollable } from '../Scrollable';

export type ModalContentProps = ElementProps<HTMLDivElement> & {
	onScrollContent?: ((touching: { top: boolean }) => void) | undefined;
	/** Stretches the content to the modal's height and closes the modal itself, for content that brings its own footer. */
	fill?: boolean;
};

const ModalContent = ({ children, onScrollContent, fill, ...props }: ModalContentProps) => (
	<Scrollable vertical onScrollContent={onScrollContent}>
		<Box rcx-modal__content>
			<Box
				rcx-modal__content-wrapper
				marginInline={24}
				height={fill ? '100%' : undefined}
				paddingBlockEnd={fill ? 16 : undefined}
				{...props}
			>
				{children}
			</Box>
		</Box>
	</Scrollable>
);

export default ModalContent;
