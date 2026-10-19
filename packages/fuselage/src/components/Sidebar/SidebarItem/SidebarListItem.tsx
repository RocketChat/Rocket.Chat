import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, RefAttributes } from 'react';

import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { boxFull } from '../sidebarStyles';

const SidebarListItemFrame = styled(View, {
	...boxFull,
	display: 'block',
});

type SidebarListItemProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		selected?: boolean;
	};

function SidebarListItemBase({ className, children, ...props }: SidebarListItemProps) {
	return (
		<SidebarListItemFrame
			role='listitem'
			className={['rcx-sidebar-item__list-item', className].filter(Boolean).join(' ')}
			{...(props as GetProps<typeof SidebarListItemFrame>)}
		>
			{children}
		</SidebarListItemFrame>
	);
}

export const SidebarListItem = withFuselageProvider(SidebarListItemBase);
