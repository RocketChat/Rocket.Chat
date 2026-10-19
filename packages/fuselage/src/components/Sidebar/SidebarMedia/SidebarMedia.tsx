import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { strokeColors, textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderWidth, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
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
});

const SidebarMediaBase = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<SidebarMediaFrame
		className={['rcx-sidebar-media', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof SidebarMediaFrame>)}
	/>
);

export const SidebarMedia = withFuselageProvider(SidebarMediaBase);
