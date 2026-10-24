import { styled, View } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { surfaceColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import type { ElementProps } from '../../types/ElementProps';

export type ModalBackdropProps = ElementProps<HTMLDivElement> & {
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
		rcx: { true: variantClass('rcx-modal__backdrop') },
		transparent: {
			true: { backgroundColor: 'transparent' },
		},
	} as const,

	defaultVariants: { rcx: true },
});

export default asPublicFrame<ModalBackdropProps>(ModalBackdropFrame);
