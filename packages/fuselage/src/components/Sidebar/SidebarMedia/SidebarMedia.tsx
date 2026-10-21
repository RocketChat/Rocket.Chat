import { styled, View } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, textIconColors } from '../../../Theme';
import { asPublicFrame } from '../../../helpers/asPublicFrame';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { variantClass } from '../../../helpers/variantClass';
import { borderWidth, spacing } from '../../../styleTokens';
import { plainElement, sidebarColorSurfaceDefault } from '../sidebarStyles';

const SidebarMediaFrame = styled(View, {
	...plainElement,
	display: 'block',
	paddingBlock: spacing('x8'),
	color: toCSSValue('--rcx-sidebar-media-color', textIconColors['font-titles-labels']),
	borderBottomWidth: borderWidth('default'),
	borderBottomStyle: 'solid',
	borderBottomColor: toCSSValue('--rcx-sidebar-media-border-color', strokeColors['stroke-light']),
	backgroundColor: sidebarColorSurfaceDefault,

	variants: {
		rcx: { true: variantClass('rcx-sidebar-media') },
	} as const,

	defaultVariants: { rcx: true },
});

export const SidebarMedia = asPublicFrame<HTMLAttributes<HTMLDivElement>>(SidebarMediaFrame);
