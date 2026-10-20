import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontScale } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalTitleProps = BoxProps;

const ModalTitleFrame = styled(Text, {
	render: 'h2',
	display: 'block',
	flexGrow: 1,
	flexShrink: 1,
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	color: String(textIconColors['font-default']),
	...modalBoxFont,
	...(fontScale('h2') as object),
});

const ModalTitle = ({ children, ...props }: ModalTitleProps) => {
	const frameProps = useTamaguiBoxProps(props, 'rcx-modal__title');

	return <ModalTitleFrame {...(frameProps as GetProps<typeof ModalTitleFrame>)}>{children}</ModalTitleFrame>;
};

export default withFuselageProvider(ModalTitle, { takesBoxTransforms: true });
