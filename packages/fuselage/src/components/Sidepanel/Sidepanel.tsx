import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { borderWidth, size } from '../../styleTokens';

const SidepanelFrame = styled(View, {
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexGrow: 1,
	flexShrink: 0,
	height: size('full'),
	color: String(textIconColors['font-default']),
	borderWidth: 0,
	borderLeftWidth: borderWidth('default'),
	borderRightWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: String(strokeColors['stroke-light']),
	backgroundColor: String(surfaceColors['surface-sidebar']),

	variants: {
		rcx: { true: variantClass('rcx-sidepanel') },
	} as const,

	defaultVariants: { rcx: true },
});

export type SidepanelProps = HTMLAttributes<HTMLDivElement>;

export default asPublicFrame<SidepanelProps>(SidepanelFrame);
