import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ModalHeaderTextProps = ElementProps<HTMLDivElement>;

const ModalHeaderText = ({ children, ...props }: ModalHeaderTextProps) => (
	<Box rcx-modal__header-text {...props}>
		{children}
	</Box>
);

export default ModalHeaderText;
