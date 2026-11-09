import type { ElementProps } from '../../types/ElementProps.js';
import { Box } from '../Box/index.js';

export type ModalBackdropProps = ElementProps<HTMLDivElement> & {
	/** Drops the overlay colour, for a backdrop that only catches events or stacks over another one. */
	transparent?: boolean;
};

const ModalBackdrop = ({ transparent, ...props }: ModalBackdropProps) => (
	<Box rcx-modal__backdrop backgroundColor={transparent ? 'transparent' : undefined} {...props} />
);

export default ModalBackdrop;
