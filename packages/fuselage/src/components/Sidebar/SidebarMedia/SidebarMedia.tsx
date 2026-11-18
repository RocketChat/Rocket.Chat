import type { HTMLAttributes } from 'react';

/** A panel at the foot of the sidebar for ongoing media, such as calls in queue, with a title and controls. */
export const SidebarMedia = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={['rcx-sidebar-media', className].filter(Boolean).join(' ')} {...props} />
);
