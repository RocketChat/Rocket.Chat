import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainElement, typography } from '../sidebarStyles';

const SidebarMediaTitleFrame = styled(Text, {
	render: 'div',
	...plainElement,
	display: 'block',
	whiteSpace: 'inherit',
	flexGrow: 1,
	paddingBottom: spacing('x4'),
	paddingInline: spacing('x16'),
	textAlign: 'center',
	...typography('c1'),
});

const SidebarMediaTitleBase = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<SidebarMediaTitleFrame
		className={['rcx-sidebar-media__title', className].filter(Boolean).join(' ')}
		{...(props as GetProps<typeof SidebarMediaTitleFrame>)}
	/>
);

export const SidebarMediaTitle = withFuselageProvider(SidebarMediaTitleBase);
