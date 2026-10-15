import type { HTMLAttributes } from 'react';

export const SidebarItemTimestamp = ({ className, unread, ...props }: { unread?: boolean } & HTMLAttributes<HTMLDivElement>) => (
	<div
		className={['rcx-box rcx-box--full rcx-sidebar-item__timestamp', unread && 'rcx-sidebar-item__timestamp--highlighted', className]
			.filter(Boolean)
			.join(' ')}
		{...props}
	/>
);
