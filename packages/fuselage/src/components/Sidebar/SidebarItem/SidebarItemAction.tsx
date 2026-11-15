import type { Keys as Icons } from '@rocket.chat/icons';
import type { HTMLAttributes, MouseEvent } from 'react';

import { Icon } from '../../Icon';

export const SidebarItemAction = ({
	children,
	className,
	icon = 'plus-small',
	...props
}: {
	onClick: (e: MouseEvent<HTMLDivElement>) => void;
	icon?: Icons;
} & HTMLAttributes<HTMLDivElement>) => (
	<div
		role='button'
		tabIndex={0}
		className={['rcx-box rcx-box--full rcx-sidebar-item rcx-sidebar-item__action', className].filter(Boolean).join(' ')}
		{...props}
	>
		<Icon name={icon} size='x20' />
		{children}
	</div>
);
