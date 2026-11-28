import type { ImgHTMLAttributes } from 'react';

import type { ElementProps } from '../../types/ElementProps';
import { Box } from '../Box';
import type { ModalSize } from './Modal';

export type ModalHeroImageProps = ElementProps<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>> & {
	/** The rendered width, which the `width` attribute alone cannot set over the fluid default. */
	width?: ModalSize;
	/** The rendered height, which the `height` attribute alone cannot set over the fluid default. */
	height?: ModalSize;
};

const ModalHeroImage = ({ ...props }: ModalHeroImageProps) => (
	<figure className='rcx-modal__hero-image-wrapper'>
		<Box rcx-modal__hero-image is='img' {...props} />
	</figure>
);

export default ModalHeroImage;
