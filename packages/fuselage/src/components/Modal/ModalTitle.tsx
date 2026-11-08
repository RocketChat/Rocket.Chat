import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalTitleProps = ElementProps<HTMLHeadingElement>;

const ModalTitle = ({ children, ...props }: ModalTitleProps) => (
	<Box is='h2' rcx-modal__title {...props}>
		{children}
	</Box>
);

export default ModalTitle;
