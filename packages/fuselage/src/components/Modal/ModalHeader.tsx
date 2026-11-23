import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';
import { Margins } from '../Margins/index.js';

export type ModalHeaderProps = ElementProps<HTMLElement>;

const ModalHeader = ({ children, ...props }: ModalHeaderProps) => (
	<Box rcx-modal__header is='header' {...props}>
		<Box rcx-modal__header-inner>
			<Margins all='x4'>{children}</Margins>
		</Box>
	</Box>
);

export default ModalHeader;
