import { styled, View } from '@tamagui/web';

import { modalBoxFont, modalContainerMargin } from './Modal';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

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
		justify: {
			'end': { justifyContent: 'end' },
			'space-between': { justifyContent: 'space-between' },
		},
	} as const,
});

const ModalFooter = ({ children, justify = 'end' }: ModalFooterProps) => (
	<ModalFooterFrame justify={justify} className='rcx-modal__footer'>
		{children}
	</ModalFooterFrame>
);

export default withFuselageProvider(ModalFooter);
