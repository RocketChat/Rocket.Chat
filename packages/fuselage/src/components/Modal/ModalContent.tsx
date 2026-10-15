import { Box, type BoxProps } from '../Box';
import { Scrollable } from '../Scrollable';

export type ModalContentProps = BoxProps & {
	onScrollContent?: ((touching: { top: boolean }) => void) | undefined;
};

const ModalContent = ({ children, onScrollContent, ...props }: ModalContentProps) => (
	<Scrollable vertical onScrollContent={onScrollContent}>
		<Box rcx-modal__content>
			<Box rcx-modal__content-wrapper marginInline={24} {...props}>
				{children}
			</Box>
		</Box>
	</Scrollable>
);

export default ModalContent;
