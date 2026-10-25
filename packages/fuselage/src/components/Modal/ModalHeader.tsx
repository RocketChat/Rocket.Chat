import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Margins } from '../Margins';

export type ModalHeaderProps = ElementProps<HTMLElement>;

const ModalHeader = ({ children, ...props }: ModalHeaderProps) => (
	<Box rcx-modal__header is='header' {...props}>
		<Box rcx-modal__header-inner>
			<Margins all='x4'>{children}</Margins>
		</Box>
	</Box>
);

export default ModalHeader;
