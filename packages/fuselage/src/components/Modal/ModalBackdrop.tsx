import { styled, View, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { surfaceColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalBackdropProps = BoxProps & {
	/** Drops the overlay colour, for a backdrop that only catches events or stacks over another one. */
	transparent?: boolean;
};

const ModalBackdropFrame = styled(View, {
	position: 'fixed',
	zIndex: 100,
	inset: 0,
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	backgroundColor: String(surfaceColors['surface-overlay']),
	...modalBoxFont,

	variants: {
		transparent: {
			true: { backgroundColor: 'transparent' },
		},
	} as const,
});

const ModalBackdrop = ({ transparent, ...props }: ModalBackdropProps) => {
	const frameProps = useTamaguiBoxProps(props, 'rcx-modal__backdrop');

	return <ModalBackdropFrame transparent={transparent} {...(frameProps as GetProps<typeof ModalBackdropFrame>)} />;
};

export default withFuselageProvider(ModalBackdrop);
