import type { AllHTMLAttributes, ElementType } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { Item } from '../../Item';

export type SidebarItemProps = {
	selected?: boolean;
	level?: number;
	is?: ElementType;
} & AllHTMLAttributes<HTMLAnchorElement>;

/**
 * A sidebar row. It renders an `Item`, so its content can also be composed from `Item` parts.
 */
export const SidebarItem = ({ selected, level = 1, className, is = 'a', ...props }: SidebarItemProps) => (
	<Item
		{...props}
		is={is}
		inset='md'
		selected={selected}
		className={cx('rcx-sidebar-item', !!selected && 'rcx-sidebar-item--selected', !!level && `rcx-sidebar-item--level-${level}`, className)}
	/>
);
