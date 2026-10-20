import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { textIconColors } from '../../Theme';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import { fontScale } from '../../styleTokens';
import type { BoxProps } from '../Box';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalTaglineProps = BoxProps;

const ModalTaglineFrame = styled(Text, {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	color: String(textIconColors['font-default']),
	...modalBoxFont,
	...(fontScale('c2') as object),
});

const ModalTagline = ({ children, ...props }: ModalTaglineProps) => {
	const frameProps = useTamaguiBoxProps(props, 'rcx-modal__tagline');

	return <ModalTaglineFrame {...(frameProps as GetProps<typeof ModalTaglineFrame>)}>{children}</ModalTaglineFrame>;
};

export default withFuselageProvider(ModalTagline, { takesBoxTransforms: true });
