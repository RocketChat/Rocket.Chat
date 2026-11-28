import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalHeaderProps = ElementProps<HTMLElement>;

const ModalHeader = ({ children, ...props }: ModalHeaderProps) => (
	<Box rcx-modal__header is='header' {...props}>
		<Box rcx-modal__header-inner>{children}</Box>
	</Box>
);

export default ModalHeader;
