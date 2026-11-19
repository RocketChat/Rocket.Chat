import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalHeaderTextProps = ElementProps<HTMLDivElement>;

/** Stacks a `ModalTagline` over the `ModalTitle` in the header, cutting them short with an ellipsis. */
const ModalHeaderText = ({ children, ...props }: ModalHeaderTextProps) => (
	<Box rcx-modal__header-text {...props}>
		{children}
	</Box>
);

export default ModalHeaderText;
