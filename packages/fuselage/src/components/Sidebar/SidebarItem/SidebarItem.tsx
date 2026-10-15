import type { AllHTMLAttributes, ElementType } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { Item } from '../../Item';

export type SidebarItemProps = {
	selected?: boolean;
	/**
	 * Emphasizes the row, such as a room with unread messages.
	 */
	highlighted?: boolean;
	level?: number;
	/**
	 * The row element. The default anchor makes the whole row a link.
	 * For a row with menus or buttons, pass `div` and put a `SidebarItemLink` inside `SidebarItemTitle`.
	 */
	is?: ElementType;
} & AllHTMLAttributes<HTMLAnchorElement>;

/**
 * A sidebar row. It renders an `Item`, so its content can also be composed from `Item` parts.
 */
export const SidebarItem = ({
	selected,
	highlighted,
	level = 1,
	className,
	is = 'a',
	href,
	target,
	rel,
	download,
	...props
}: SidebarItemProps) => {
	const isContainer = typeof is === 'string' && is !== 'a';

	return (
		<Item
			{...props}
			{...(!isContainer && { href, target, rel, download })}
			is={is}
			inset='md'
			selected={selected}
			highlighted={highlighted}
			className={cx(
				'rcx-sidebar-item',
				!!selected && 'rcx-sidebar-item--selected',
				!!level && `rcx-sidebar-item--level-${level}`,
				className,
			)}
		/>
	);
};
