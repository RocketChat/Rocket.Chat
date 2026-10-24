import { styled, View } from '@tamagui/web';

import { modalBoxFont, modalContainerMargin } from './Modal';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import type { ElementProps } from '../../types/ElementProps';

export type ModalFooterProps = ElementProps<HTMLDivElement> & {
	/** Spreads the actions apart instead of packing them at the end, for a footer with content on its start side. */
	justify?: 'end' | 'space-between';
};

const ModalFooterFrame = styled(View, {
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	margin: modalContainerMargin,
	...modalBoxFont,

	variants: {
		rcx: { true: variantClass('rcx-modal__footer') },
		justify: {
			'end': { justifyContent: 'end' },
			'space-between': { justifyContent: 'space-between' },
		},
	} as const,

	defaultVariants: { rcx: true, justify: 'end' },
});

export default asPublicFrame<ModalFooterProps>(ModalFooterFrame);
