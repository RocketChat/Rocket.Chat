import type { RefAttributes, HTMLAttributes } from 'react';

export type SidebarProps = HTMLAttributes<HTMLElement> &
	RefAttributes<HTMLElement> & {
		collapsed?: boolean;
	};

export function Sidebar({ collapsed, className, ...props }: SidebarProps) {
	return (
		<nav
			className={['rcx-box rcx-box--full rcx-sidebar', 'rcx-box--animated', collapsed && 'rcx-sidebar--collapsed', className]
				.filter(Boolean)
				.join(' ')}
			{...props}
		/>
	);
}
