import { styled, Text } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { fontScale } from '../../styleTokens';

const h5 = fontScale('h5');

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

	variants: {
		rcx: { true: variantClass('rcx-sidepanel-header__title') },
	} as const,

	defaultVariants: { rcx: true },
});

export type SidepanelHeaderTitleProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<SidepanelHeaderTitleProps>(SidepanelHeaderTitleFrame);
