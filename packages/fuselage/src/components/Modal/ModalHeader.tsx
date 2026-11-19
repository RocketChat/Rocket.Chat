import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import { Margins } from '../Margins';

export type ModalHeaderProps = ElementProps<HTMLElement>;

/** Top row of the modal: a `ModalIcon` or `ModalThumb` if needed, the `ModalHeaderText` and a `ModalClose`. */
const ModalHeader = ({ children, ...props }: ModalHeaderProps) => (
	<Box rcx-modal__header is='header' {...props}>
		<Box rcx-modal__header-inner>
			<Margins all='x4'>{children}</Margins>
		</Box>
	</Box>
);

export default ModalHeader;
