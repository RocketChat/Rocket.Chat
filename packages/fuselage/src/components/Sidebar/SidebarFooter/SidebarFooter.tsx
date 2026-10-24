import { styled, View, type GetProps } from '@tamagui/web';
import { useContext, type HTMLAttributes } from 'react';

import { surfaceColors, textIconColors } from '../../../Theme';
import { size, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { SidebarCollapsedContext } from '../Sidebar';
import { hiddenWhileCollapsed, plainElement } from '../sidebarStyles';

const SidebarFooterFrame = styled(View, {
	render: 'footer',
	...plainElement,
	justifyContent: 'center',
	minHeight: size('x48'),
	paddingTop: spacing('x12'),
	paddingBottom: spacing('x8'),
	paddingInline: spacing('x16'),
	color: textIconColors['font-default'].toString(),
	backgroundColor: surfaceColors['surface-sidebar'].toString(),
	gap: spacing('x4'),

	variants: {
		collapsed: {
			true: hiddenWhileCollapsed,
		},
	} as const,
});

const SidebarFooterBase = ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
	<SidebarFooterFrame
		className='rcx-sidebar-footer'
		collapsed={useContext(SidebarCollapsedContext)}
		{...(props as GetProps<typeof SidebarFooterFrame>)}
	>
		{children}
	</SidebarFooterFrame>
);

export const SidebarFooter = withFuselageProvider(SidebarFooterBase);
