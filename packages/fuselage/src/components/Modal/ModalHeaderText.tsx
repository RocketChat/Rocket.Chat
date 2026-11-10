import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalHeaderTextProps = ElementProps<HTMLDivElement>;

const ModalHeaderText = ({ children, ...props }: ModalHeaderTextProps) => (
	<Box rcx-modal__header-text {...props}>
		{children}
	</Box>
);

export default ModalHeaderText;
