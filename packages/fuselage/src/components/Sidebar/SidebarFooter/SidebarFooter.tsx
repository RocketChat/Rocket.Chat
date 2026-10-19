import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes } from 'react';

import { surfaceColors, textIconColors } from '../../../Theme';
import { size, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { plainElement } from '../sidebarStyles';

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
});

const SidebarFooterBase = ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
	<SidebarFooterFrame className='rcx-sidebar-footer' {...(props as GetProps<typeof SidebarFooterFrame>)}>
		{children}
	</SidebarFooterFrame>
);

export const SidebarFooter = withFuselageProvider(SidebarFooterBase);
