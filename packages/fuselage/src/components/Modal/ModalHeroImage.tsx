import { styled, View, type GetProps } from '@tamagui/web';
import type { CSSProperties, ImgHTMLAttributes } from 'react';

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
	// A caller's size travels as a custom property, so the frame's styles stay static and app CSS can still override them
	width: 'var(--rcx-modal-hero-image-width, 100%)',
	height: 'var(--rcx-modal-hero-image-height, auto)',
	objectFit: 'contain',
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outlineStyle: 'none',
});

const ModalHeroImage = ({ width, height, className, style, ...props }: ModalHeroImageProps) => (
	<ModalHeroImageWrapper className='rcx-modal__hero-image-wrapper'>
		<ModalHeroImageFrame
			style={{ ...style, '--rcx-modal-hero-image-width': size(width), '--rcx-modal-hero-image-height': size(height) } as CSSProperties}
			className={['rcx-modal__hero-image', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof ModalHeroImageFrame>)}
		/>
	</ModalHeroImageWrapper>
);

export default withFuselageProvider(ModalHeroImage);
