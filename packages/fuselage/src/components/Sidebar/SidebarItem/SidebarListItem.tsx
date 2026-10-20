import type { HTMLAttributes, RefAttributes } from 'react';

type SidebarListItemProps = HTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		selected?: boolean;
	};

export function SidebarListItem({ className, children, ...props }: SidebarListItemProps) {
	return (
		<div role='listitem' className={['rcx-box rcx-box--full rcx-sidebar-item__list-item', className].filter(Boolean).join(' ')} {...props}>
			{children}
		</div>
	);
}
