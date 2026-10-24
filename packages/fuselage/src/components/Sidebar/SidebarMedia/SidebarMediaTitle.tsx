import { styled, Text, type GetProps } from '@tamagui/web';
import { useContext, type HTMLAttributes } from 'react';

import { spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { SidebarCollapsedContext } from '../Sidebar';
import { hiddenWhileCollapsed, plainElement, typography } from '../sidebarStyles';

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

	variants: {
		collapsed: {
			true: hiddenWhileCollapsed,
		},
	} as const,
});

const SidebarMediaTitleBase = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<SidebarMediaTitleFrame
		className={['rcx-sidebar-media__title', className].filter(Boolean).join(' ')}
		collapsed={useContext(SidebarCollapsedContext)}
		{...(props as GetProps<typeof SidebarMediaTitleFrame>)}
	/>
);

export const SidebarMediaTitle = withFuselageProvider(SidebarMediaTitleBase);
