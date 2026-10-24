import type { AllHTMLAttributes, ElementType } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import { spacing } from '../../../styleTokens';
import { Item } from '../../Item';
import { frameStyle } from '../sidebarStyles';

export type SidebarItemProps = {
	selected?: boolean;
	/**
	 * Emphasizes the row, such as a room with unread messages.
	 */
	highlighted?: boolean;
	/**
	 * Shows the row as a listbox's active descendant.
	 */
	focused?: boolean;
	/**
	 * Shows the focus ring for an active descendant reached from the keyboard.
	 */
	focusVisible?: boolean;
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
	focused,
	focusVisible,
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
			{...(level === 2 && frameStyle({ paddingBlock: spacing('x8') }))}
			is={is}
			inset='md'
			selected={selected}
			highlighted={highlighted}
			focused={focused}
			focusVisible={focusVisible}
			className={cx(
				'rcx-sidebar-item',
				!!selected && 'rcx-sidebar-item--selected',
				!!level && `rcx-sidebar-item--level-${level}`,
				className,
			)}
		/>
	);
};
