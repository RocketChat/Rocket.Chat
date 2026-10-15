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
	selected,
	highlighted,
	focused,
	disabled,
	variant,
	className,
	onClick,
	children,
	...props
}: ItemProps) => {
	const [descriptionIds, registerDescription] = useIdRegistry();

	const contextValue = useMemo(() => ({ descriptionIds, registerDescription }), [descriptionIds, registerDescription]);

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
				className={cx(
					cxx('rcx-item')({
						[`inset-${inset}`]: inset !== 'none',
						clickable: !!onClick,
						selected: !!selected,
						highlighted: !!highlighted,
						focused: !!focused,
						disabled: !!disabled,
						danger: variant === 'danger',
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
