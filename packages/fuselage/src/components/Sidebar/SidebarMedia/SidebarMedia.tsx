import type { HTMLAttributes } from 'react';

export const SidebarMedia = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-sidebar-media', className].filter(Boolean).join(' ')} {...props} />
);
