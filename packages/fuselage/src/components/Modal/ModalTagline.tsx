import { Box, type BoxProps } from '../Box';

export type ModalTaglineProps = BoxProps & {
	/** Mutes the tagline, so it reads as a category above the title. */
	subtle?: boolean;
};

const ModalTagline = ({ subtle, children, ...props }: ModalTaglineProps) => (
	<Box rcx-modal__tagline color={subtle ? 'annotation' : undefined} {...props}>
		{children}
	</Box>
);

export default ModalTagline;
