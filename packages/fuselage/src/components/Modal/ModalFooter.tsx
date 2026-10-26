import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalFooterProps = ElementProps<HTMLDivElement> & {
	/** Spreads the actions apart instead of packing them at the end, for a footer with content on its start side. */
	justify?: 'end' | 'space-between';
};

const ModalFooter = ({ justify = 'end', ...props }: ModalFooterProps) => <Box justifyContent={justify} rcx-modal__footer {...props} />;

export default ModalFooter;
