import { styled, View, type GetProps } from '@tamagui/web';
import type { ImgHTMLAttributes } from 'react';

import { size } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalHeroImageProps = ElementProps<HTMLImageElement, ImgHTMLAttributes<HTMLImageElement>> & {
	/** The rendered width, which the `width` attribute alone cannot set over the fluid default. */
	width?: BoxProps['width'];
	/** The rendered height, which the `height` attribute alone cannot set over the fluid default. */
	height?: BoxProps['height'];
};

const ModalHeroImageWrapper = styled(View, {
	render: 'figure',
	display: 'block',
	boxSizing: 'content-box',
	marginTop: 0,
	marginBottom: size('x24'),
	marginInline: size('neg-x24'),
});

const ModalHeroImageFrame = styled(View, {
	render: 'img',
	display: 'block',
	width: '100%',
	height: 'auto',
	objectFit: 'contain',
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
});

const ModalHeroImage = ({ width, height, className, ...props }: ModalHeroImageProps) => (
	<ModalHeroImageWrapper className='rcx-modal__hero-image-wrapper'>
		<ModalHeroImageFrame
			{...(width !== undefined && { width: size(width) })}
			{...(height !== undefined && { height: size(height) })}
			className={['rcx-modal__hero-image', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof ModalHeroImageFrame>)}
		/>
	</ModalHeroImageWrapper>
);

export default withFuselageProvider(ModalHeroImage);
