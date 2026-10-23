import { Box, type BoxProps } from '../Box';

export type ModalHeroImageProps = BoxProps & {
	/** The rendered width, which the `width` attribute alone cannot set over the fluid default. */
	width?: BoxProps['width'];
	/** The rendered height, which the `height` attribute alone cannot set over the fluid default. */
	height?: BoxProps['height'];
};

const ModalHeroImage = ({ ...props }: ModalHeroImageProps) => (
	<figure className='rcx-modal__hero-image-wrapper'>
		<Box rcx-modal__hero-image is='img' {...props} />
	</figure>
);

export default ModalHeroImage;
