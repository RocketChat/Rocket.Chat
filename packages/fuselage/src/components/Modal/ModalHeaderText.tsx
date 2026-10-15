import { Box, type BoxProps } from '../Box';

export type ModalHeaderTextProps = BoxProps;

const ModalHeaderText = ({ children, ...props }: ModalHeaderTextProps) => (
	<Box rcx-modal__header-text {...props}>
		{children}
	</Box>
);

export default ModalHeaderText;
