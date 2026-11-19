import type { RefAttributes, HTMLAttributes } from 'react';

export type SidebarProps = HTMLAttributes<HTMLElement> &
	RefAttributes<HTMLElement> & {
		/** Narrows the sidebar to a 48px column, hiding the text of its links, banners, media and footer while it is not hovered. */
		collapsed?: boolean;
	};

/**
 * The navigation column that lists the user's rooms (channels, teams, discussions and direct messages) in collapsible
 * categories.
 */
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
