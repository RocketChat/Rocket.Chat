import { Box, type BoxProps } from '../Box';

export type ModalTitleProps = BoxProps;

const ModalTitle = ({ children, ...props }: ModalTitleProps) => (
	<Box is='h2' rcx-modal__title {...props}>
		{children}
	</Box>
);

export default ModalTitle;
