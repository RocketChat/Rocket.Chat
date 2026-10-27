import type { HTMLAttributes } from 'react';

export const SidebarMediaTitle = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-sidebar-media__title', className].filter(Boolean).join(' ')} {...props} />
);
