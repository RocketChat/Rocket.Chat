import { styled, View, type GetProps } from '@tamagui/web';

import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { size } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalHeroImageProps = BoxProps & {
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

const ModalHeroImage = ({ ...props }: ModalHeroImageProps) => {
	const imageProps = useTamaguiBoxProps(props, 'rcx-modal__hero-image');

	return (
		<ModalHeroImageWrapper className='rcx-modal__hero-image-wrapper'>
			<ModalHeroImageFrame {...(imageProps as GetProps<typeof ModalHeroImageFrame>)} />
		</ModalHeroImageWrapper>
	);
};

export default withFuselageProvider(ModalHeroImage, { takesBoxTransforms: true });
