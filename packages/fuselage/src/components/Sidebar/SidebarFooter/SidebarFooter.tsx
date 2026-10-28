import type { HTMLAttributes } from 'react';

export const SidebarFooter = ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
	<footer className='rcx-sidebar-footer' {...props}>
		{children}
	</footer>
);
