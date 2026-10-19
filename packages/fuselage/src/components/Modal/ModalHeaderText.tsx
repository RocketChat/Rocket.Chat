import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import { useTamaguiBoxProps } from '../../hooks/useTamaguiBoxProps';
import type { BoxProps } from '../Box';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalHeaderTextProps = BoxProps;

const ModalHeaderTextFrame = styled(Text, {
	render: 'div',
	display: 'flex',
	flexDirection: 'column',
	flexGrow: 1,
	flexShrink: 1,
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	...modalBoxFont,
});

const ModalHeaderText = ({ children, ...props }: ModalHeaderTextProps) => {
	const transform = useBoxTransform();
	const frameProps = useTamaguiBoxProps(transform ? transform(props) : props, 'rcx-modal__header-text');

	const frame = <ModalHeaderTextFrame {...(frameProps as GetProps<typeof ModalHeaderTextFrame>)}>{children}</ModalHeaderTextFrame>;

	return transform ? <BoxTransforms.Provider value={null}>{frame}</BoxTransforms.Provider> : frame;
};

export default withFuselageProvider(ModalHeaderText);
