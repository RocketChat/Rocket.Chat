import { styled, View, type GetProps } from '@tamagui/web';

import { modalBoxFont, modalContainerMargin } from './Modal';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalFooterProps = BoxProps;

const ModalFooterFrame = styled(View, {
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	margin: modalContainerMargin,
	...modalBoxFont,
});

const ModalFooter = ({ children, justifyContent = 'end' }: ModalFooterProps) => {
	const frameProps = useTamaguiBoxProps({ justifyContent } as BoxProps, 'rcx-modal__footer');

	return <ModalFooterFrame {...(frameProps as GetProps<typeof ModalFooterFrame>)}>{children}</ModalFooterFrame>;
};

export default withFuselageProvider(ModalFooter, { takesBoxTransforms: true });
