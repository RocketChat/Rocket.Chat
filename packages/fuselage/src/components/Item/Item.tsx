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

const interactiveSelector =
	'a[href], button, input, select, textarea, label, summary, [role="button"], [role="link"], [role^="menuitem"], [tabindex]';

// Content raised above the link to show its tooltip, such as an avatar, still opens the row when clicked.
const findForwardTarget = ({ target, currentTarget }: MouseEvent<HTMLElement>) => {
	if (!(target instanceof Element) || !window.getSelection()?.isCollapsed) {
		return undefined;
	}

	const interactive = target.closest(interactiveSelector);
	if (interactive && currentTarget.contains(interactive)) {
		return undefined;
	}

	return currentTarget.querySelector<HTMLElement>('.rcx-item__link') ?? undefined;
};

/**
 * A list row composed from slots: media, icon, content and actions.
 */
const Item = ({
	is: Tag = 'div',
	inset = 'none',
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

	const handleClick = (event: MouseEvent<HTMLElement>) => {
		if (disabled) {
			return;
		}

		const link = findForwardTarget(event);
		if (link) {
			event.stopPropagation();
			link.dispatchEvent(new window.MouseEvent('click', event.nativeEvent));
			return;
		}

		onClick?.(event);
	};

	return (
		<ItemContext.Provider value={contextValue}>
			<Tag
				{...props}
				aria-labelledby={ariaLabelledBy}
				aria-describedby={ariaDescribedBy}
				className={cx(
					cxx('rcx-item')({
						[`inset-${inset}`]: inset !== 'none',
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
