import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, surfaceColors } from '../../Theme';
import { asPublicFrame } from '../../helpers/asPublicFrame';
import { variantClass } from '../../helpers/variantClass';
import { borderWidth, spacing } from '../../styleTokens';

const NavBarFrame = styled(View, {
	render: 'nav',
	boxSizing: 'content-box',
	minWidth: 'auto',
	minHeight: 'auto',
	flexDirection: 'row',
	flexShrink: 1,
	justifyContent: 'space-between',
	alignItems: 'center',
	width: '100%',
	paddingBlock: spacing('x8'),
	paddingInline: spacing('x16'),
	borderWidth: 0,
	borderBottomWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: String(strokeColors['stroke-light']),
	backgroundColor: String(surfaceColors['surface-sidebar']),

	variants: {
		rcx: { true: variantClass('rcx-navbar') },
	} as const,

	defaultVariants: { rcx: true },
});

export type NavBarProps = HTMLAttributes<HTMLElement>;

export default asPublicFrame<NavBarProps>(NavBarFrame);
