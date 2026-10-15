import { Box, type BoxProps } from '../Box';

export type ModalHeroImageProps = BoxProps;

const ModalHeroImage = ({ ...props }: ModalHeroImageProps) => (
	<figure className='rcx-modal__hero-image-wrapper'>
		<Box rcx-modal__hero-image is='img' {...props} />
	</figure>
);

export default ModalHeroImage;
