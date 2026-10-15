import type { HTMLAttributes } from 'react';

export const SidebarItemAvatarWrapper = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-box rcx-box--full rcx-sidebar-item__avatar', className].filter(Boolean).join(' ')} {...props} />
);
