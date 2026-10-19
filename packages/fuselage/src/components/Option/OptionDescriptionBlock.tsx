import { styled, Text } from '@tamagui/web';
import type { ReactNode } from 'react';

import { textIconColors } from '../../Theme';
import { fontScale, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const { fontWeight, ...p2 } = fontScale('p2')!;

const OptionDescriptionBlockFrame = styled(Text, {
	render: 'div',
	display: 'block',
	padding: spacing('x4'),
	whiteSpace: 'normal',
	wordBreak: 'break-word',
	wordWrap: 'inherit',
	color: String(textIconColors['font-secondary-info']),
	...p2,
	fontWeight: fontWeight as 400,
});

export type OptionDescriptionBlockProps = {
	children?: ReactNode;
};

const OptionDescriptionBlock = (props: OptionDescriptionBlockProps) => (
	<OptionDescriptionBlockFrame className='rcx-option__description-block' {...props} />
);

export default withFuselageProvider(OptionDescriptionBlock);
