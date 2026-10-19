import { styled, View, type GetProps } from '@tamagui/web';
import type { RefAttributes, HTMLAttributes } from 'react';

import { boxFull, sidebarColorFontDefault, sidebarColorSurfaceDefault } from './sidebarStyles';
import { size } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const SidebarFrame = styled(View, {
	render: 'nav',
	...boxFull,
	position: 'relative',
	height: size('full'),
	color: sidebarColorFontDefault,
	backgroundColor: sidebarColorSurfaceDefault,

	variants: {
		collapsed: {
			true: {
				overflow: 'hidden',
				width: size('x48'),
			},
		},
	} as const,
});

export type SidebarProps = HTMLAttributes<HTMLElement> &
	RefAttributes<HTMLElement> & {
		collapsed?: boolean;
	};

function SidebarBase({ collapsed, className, ...props }: SidebarProps) {
	return (
		<SidebarFrame
			collapsed={collapsed}
			className={['rcx-sidebar', 'rcx-box--animated', collapsed && 'rcx-sidebar--collapsed', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof SidebarFrame>)}
		/>
	);
}

export const Sidebar = withFuselageProvider(SidebarBase);
