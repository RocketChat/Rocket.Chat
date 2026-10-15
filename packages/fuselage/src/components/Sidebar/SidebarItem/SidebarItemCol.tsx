import type { HTMLAttributes } from 'react';

export const SidebarItemCol = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-box rcx-box--full rcx-sidebar-item__col', className].filter(Boolean).join(' ')} {...props} />
);
