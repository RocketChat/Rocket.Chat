import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';

export type ModalTaglineProps = ElementProps<HTMLDivElement> & {
	/** Mutes the tagline, so it reads as a category above the title. */
	subtle?: boolean;
};

const ModalTagline = ({ subtle, children, ...props }: ModalTaglineProps) => (
	<Box rcx-modal__tagline color={subtle ? 'annotation' : undefined} {...props}>
		{children}
	</Box>
);

export default ModalTagline;
