import type { AllHTMLAttributes, ElementType, MouseEvent, RefAttributes } from 'react';
import { useMemo } from 'react';

import { ItemContext } from './ItemContext';
import type { ItemInset } from './types';
import { useIdRegistry } from './useIdRegistry';
import { cx, cxx } from '../../helpers/composeClassNames';

export type ItemProps = {
	/**
	 * The element to render. Use `li` inside a list; set `role` for listbox options or menu items.
	 */
	is?: ElementType;
	/**
	 * Adds space between the row edge and its first and last slots.
	 */
	inset?: ItemInset;
	/**
	 * Aligns the slots to the top edge, so a tall avatar sits above a multi-line body. Slots center by default.
	 */
	align?: 'center' | 'start';
	/**
	 * Shows the hover surface even when the row has no click target, as for rows whose content is interactive.
	 */
	hoverable?: boolean;
	selected?: boolean;
	/**
	 * Emphasizes the title, icon, description and meta, as for unread rooms.
	 */
	highlighted?: boolean;
	/**
	 * Shows the hover surface for a virtual cursor, such as a listbox's active descendant.
	 */
	focused?: boolean;
	/**
	 * Shows the focus ring for focus a script moves, such as a menu's, where the browser's `:focus-visible` also matches on hover.
	 * Once set, it replaces `:focus-visible` for the row.
	 */
	focusVisible?: boolean;
	/**
	 * Dims the row and ignores clicks. Set the matching ARIA state through props.
	 */
	disabled?: boolean;
	variant?: 'danger';
} & Omit<AllHTMLAttributes<HTMLElement>, 'is' | 'selected' | 'disabled'> &
	RefAttributes<HTMLElement>;

/**
 * A list row composed from slots: media, icon, content and actions.
 */
const Item = ({
	is: Tag = 'div',
	inset = 'none',
	align = 'center',
	hoverable,
	selected,
	highlighted,
	focused,
	focusVisible,
	disabled,
	variant,
	className,
	onClick,
	children,
	...props
}: ItemProps) => {
	const [descriptionIds, registerDescription] = useIdRegistry();
	const [titleIds, registerTitle] = useIdRegistry();

	const contextValue = useMemo(
		() => ({ descriptionIds, registerDescription, registerTitle }),
		[descriptionIds, registerDescription, registerTitle],
	);

	// A menu item is named by its titles and described by its labelled icons, as an `ItemLink` is.
	const isMenuItem = !!props.role?.startsWith('menuitem');

	const ariaLabelledBy = isMenuItem ? (props['aria-labelledby'] ?? (titleIds.join(' ') || undefined)) : props['aria-labelledby'];

	const ariaDescribedBy = isMenuItem
		? [props['aria-describedby'], ...descriptionIds].filter(Boolean).join(' ') || undefined
		: props['aria-describedby'];

	const handleClick = onClick
		? (event: MouseEvent<HTMLElement>) => {
				if (disabled) {
					return;
				}
				onClick(event);
			}
		: undefined;

	return (
		<ItemContext.Provider value={contextValue}>
			<Tag
				{...props}
				aria-labelledby={ariaLabelledBy}
				aria-describedby={ariaDescribedBy}
				className={cx(
					cxx('rcx-item')({
						[`inset-${inset}`]: inset !== 'none',
						[`align-${align}`]: align !== 'center',
						'hoverable': !!hoverable,
						'clickable': !!onClick,
						'selected': !!selected,
						'highlighted': !!highlighted,
						'focused': !!focused,
						'focus-managed': focusVisible !== undefined,
						'focus-visible': !!focusVisible,
						'disabled': !!disabled,
						'danger': variant === 'danger',
					}),
					className,
				)}
				onClick={handleClick}
			>
				{children}
			</Tag>
		</ItemContext.Provider>
	);
};

export default Item;
