import type { AllHTMLAttributes, ElementType } from 'react';

export type SidebarItemProps = {
	selected?: boolean;
	level?: number;
	is?: ElementType;
} & AllHTMLAttributes<HTMLAnchorElement>;

export const SidebarItem = ({ selected, level = 1, className, children, is: Tag = 'a', ...props }: SidebarItemProps) => (
	<Tag
		className={[
			'rcx-box rcx-box--full rcx-sidebar-item',
			selected && 'rcx-sidebar-item--selected',
			level && `rcx-sidebar-item--level-${level}`,
			className,
		]
			.filter(Boolean)
			.join(' ')}
		{...props}
	>
		{children}
	</Tag>
);
