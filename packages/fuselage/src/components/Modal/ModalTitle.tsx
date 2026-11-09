import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ModalTitleProps = ElementProps<HTMLHeadingElement>;

const ModalTitle = ({ children, ...props }: ModalTitleProps) => (
	<Box is='h2' rcx-modal__title {...props}>
		{children}
	</Box>
);

export default ModalTitle;
