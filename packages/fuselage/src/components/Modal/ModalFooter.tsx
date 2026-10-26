import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalFooterProps = ElementProps<HTMLDivElement> & {
	/** Spreads the actions apart instead of packing them at the end, for a footer with content on its start side. */
	justify?: 'end' | 'space-between';
};

const ModalFooter = ({ justify = 'end', ...props }: ModalFooterProps) => <Box rcx-modal__footer rcx-modal__footer--justify={justify} {...props} />;

export default ModalFooter;
