import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalBackdropProps = ElementProps<HTMLDivElement> & {
	/** Drops the overlay colour, for a backdrop that only catches events or stacks over another one. */
	transparent?: boolean;
	/** Covers its positioned container instead of the viewport. */
	contained?: boolean;
};

const ModalBackdrop = ({ transparent, contained, ...props }: ModalBackdropProps) => (
	<Box
		rcx-modal__backdrop
		rcx-modal__backdrop--contained={contained}
		backgroundColor={transparent ? 'transparent' : undefined}
		{...props}
	/>
);

export default ModalBackdrop;
