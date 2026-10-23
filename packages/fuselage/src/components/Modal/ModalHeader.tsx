import { styled, View, type GetProps } from '@tamagui/web';

import { modalBoxFont, modalContainerMargin } from './Modal';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';
import { Margins } from '../Margins';

export type ModalHeaderProps = ElementProps<HTMLElement>;

const ModalHeaderFrame = styled(View, {
	render: 'header',
	display: 'block',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	margin: modalContainerMargin,
	...modalBoxFont,
});

const ModalHeaderInner = styled(View, {
	flexDirection: 'row',
	flexWrap: 'nowrap',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	margin: -4,
});

const ModalHeader = ({ children, ...props }: ModalHeaderProps) => {
	const frameProps = useTamaguiBoxProps(props, 'rcx-modal__header');

	return (
		<ModalHeaderFrame {...(frameProps as GetProps<typeof ModalHeaderFrame>)}>
			<ModalHeaderInner className='rcx-modal__header-inner'>
				<Margins all='x4'>{children}</Margins>
			</ModalHeaderInner>
		</ModalHeaderFrame>
	);
};

export default withFuselageProvider(ModalHeader, { takesBoxTransforms: true });
