import { Box, type BoxProps } from '../Box';

export type ModalFooterProps = BoxProps & {
	/** Spreads the actions apart instead of packing them at the end, for a footer with content on its start side. */
	justify?: 'end' | 'space-between';
};

const ModalFooter = ({ children, justify = 'end', justifyContent = justify }: ModalFooterProps) => (
	<Box justifyContent={justifyContent} rcx-modal__footer>
		{children}
	</Box>
);

export default ModalFooter;
