import { styled, View, type GetProps } from '@tamagui/web';

import { modalBoxFont, modalContainerMargin } from './Modal';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import type { BoxProps } from '../Box';
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
});

const ModalFooter = ({ children, justify = 'end' }: ModalFooterProps) => {
	const frameProps = useTamaguiBoxProps({ justifyContent: justify } as BoxProps, 'rcx-modal__footer');

	return <ModalFooterFrame {...(frameProps as GetProps<typeof ModalFooterFrame>)}>{children}</ModalFooterFrame>;
};

export default withFuselageProvider(ModalFooter, { takesBoxTransforms: true });
