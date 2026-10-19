import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { textIconColors } from '../../Theme';
import { fontScale } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const h5 = fontScale('h5')!;

const SidepanelHeaderTitleFrame = styled(Text, {
	render: 'div',
	display: 'block',
	color: String(textIconColors['font-titles-labels']),
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	fontSize: h5.fontSize,
	fontWeight: String(h5.fontWeight) as '700',
	lineHeight: h5.lineHeight,
	letterSpacing: h5.letterSpacing,
});

export type SidepanelHeaderTitleProps = HTMLAttributes<HTMLDivElement>;

const SidepanelHeaderTitle = ({ className, ...props }: SidepanelHeaderTitleProps) => (
	<SidepanelHeaderTitleFrame
		className={['rcx-sidepanel-header__title', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof SidepanelHeaderTitleFrame>)}
	/>
);

export default withFuselageProvider(SidepanelHeaderTitle);
