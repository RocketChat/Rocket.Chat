import { styled, Text, type GetProps } from '@tamagui/web';

import { modalBoxFont } from './Modal';
import type { ElementProps } from '../../types/ElementProps';
import { BoxTransforms, useBoxTransform } from '../Box/BoxTransforms';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

export type ModalHeaderTextProps = ElementProps<HTMLDivElement>;

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

const ModalHeaderText = ({ children, className, ...props }: ModalHeaderTextProps) => {
	const transform = useBoxTransform();

	const frame = (
		<ModalHeaderTextFrame
			className={['rcx-modal__header-text', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof ModalHeaderTextFrame>)}
		>
			{children}
		</ModalHeaderTextFrame>
	);

	return transform ? <BoxTransforms.Provider value={null}>{frame}</BoxTransforms.Provider> : frame;
};

export default withFuselageProvider(ModalHeaderText);
