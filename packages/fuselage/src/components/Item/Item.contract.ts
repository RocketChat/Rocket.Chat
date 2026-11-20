import type { ReactNode } from 'react';

import type { ActionAccessibilityAttributes, CommonAttributes, PressEvents } from '../../types/Attributes.contract';

export type ItemInset = 'none' | 'sm' | 'md' | 'lg';

/** What every part of an `Item` takes besides its own variations. */
export type ItemPartContract = CommonAttributes &
	ActionAccessibilityAttributes &
	PressEvents & {
		children?: ReactNode;
	};

export type ItemContract = ItemPartContract & {
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
	 * Shows the focus ring for focus a script moves, such as a menu's, where the platform's own focus ring also shows on hover.
	 * Once set, it replaces the platform's focus ring for the row.
	 */
	focusVisible?: boolean;
	/**
	 * Dims the row and ignores presses. Set the matching ARIA state through props.
	 */
	disabled?: boolean;
	/**
	 * Marks the row as the one being edited, as a message whose text is in the composer.
	 */
	editing?: boolean;
	variant?: 'danger' | 'success' | 'warning';
	/**
	 * Widens the gap between the slots, as a row whose content takes two lines needs. A row told nothing counts the
	 * children of the `ItemContent` it holds directly; a row that holds it through another component says so here.
	 */
	multiline?: boolean;
	/**
	 * Declares that the row reacts to the pointer: set it for a row that holds an `ItemLink`, a button or any other target.
	 * A row with `onPress`, a link row, an option and a menu item already do.
	 */
	interactive?: boolean;
	/**
	 * Shows the grab cursor on the whole row, for rows dragged without an `ItemDragHandle`.
	 */
	grabbable?: boolean;
	/**
	 * Dims the row while a copy of it is being dragged.
	 */
	dragging?: boolean;
	/**
	 * Draws the line where a dragged row would land, on this row's top (`before`) or bottom (`after`) edge.
	 */
	dropIndicator?: 'before' | 'after';
	/**
	 * Marks the row as a place a dragged row goes into, such as a folder: `available` while a drag that could land on it is
	 * under way, `active` while the pointer is over it.
	 */
	dropTarget?: 'available' | 'active';
	/**
	 * Marks the row as hovered by a drag that cannot land on it.
	 */
	dropDisabled?: boolean;
	/**
	 * Flashes the row once, where a dragged or keyboard-moved row has just landed.
	 */
	dropped?: boolean;
};

export type ItemActionsContract = ItemPartContract & {
	/**
	 * `hover` hides the actions until the row is hovered, holds focus or has an open menu.
	 * They stay in the focus order, and touch screens always show them.
	 */
	reveal?: 'always' | 'hover';
	/**
	 * `end` packs the actions at the end of a slot of at least 20px, as the control of an option.
	 */
	justify?: 'start' | 'end';
};

export type ItemContentContract = ItemPartContract;

export type ItemDescriptionContract = ItemPartContract & {
	/**
	 * Places the description right after the title, as with a username after a name.
	 * In narrow lists it moves to its own line.
	 */
	inline?: boolean;
	/**
	 * Set to `false` to wrap long text instead of ending it in an ellipsis.
	 */
	truncate?: boolean;
	/**
	 * `large` uses the title's text size, for a status or any line that should read as much as the title.
	 */
	size?: 'default' | 'large';
};

export type ItemDividerContract = ItemPartContract & {
	/**
	 * Aligns the line with the content of the rows. Without it, the line spans the full width.
	 */
	inset?: ItemInset;
};

export type ItemDragHandleContract = ItemPartContract & {
	/**
	 * Shows the grip as unavailable, for a row that cannot move right now.
	 */
	disabled?: boolean;
};

export type ItemDropSlotContract = ItemPartContract & {
	/**
	 * `available` while a drag that could land in the empty group is under way, `active` while the pointer is over it.
	 */
	dropTarget?: 'available' | 'active';
};

export type ItemGroupContract = ItemPartContract & {
	/**
	 * Dims the whole group while it is being dragged.
	 */
	dragging?: boolean;
	/**
	 * Highlights the group as the place a dragged row goes into, when its rows keep their own order: `available` while a drag
	 * that could land on it is under way, `active` while the pointer is over it.
	 */
	dropTarget?: 'available' | 'active';
	/**
	 * Draws the line where a dragged group would land, on this group's top (`before`) or bottom (`after`) edge.
	 */
	dropIndicator?: 'before' | 'after';
	/**
	 * Marks the group as hovered by a drag that cannot land on it.
	 */
	dropDisabled?: boolean;
	/**
	 * Flashes the group once, where a dragged or keyboard-moved group has just landed.
	 */
	dropped?: boolean;
	/**
	 * Takes the group out of the page and of the accessibility tree, as a collapsed one.
	 */
	hidden?: boolean;
};

export type ItemGroupHeaderContract = ItemPartContract & {
	/**
	 * Aligns the header with the rows below it. Use the same value as their `Item`.
	 */
	inset?: ItemInset;
	/**
	 * Pins the header to the top of its scroll container.
	 */
	sticky?: boolean;
	/**
	 * Shows the hover surface, for a header whose title is a button.
	 */
	interactive?: boolean;
};

export type ItemGroupTitleContract = ItemPartContract;

export type ItemIconContract = ItemPartContract & {
	/**
	 * Names what the icon conveys, such as "Private channel" or "Away".
	 * The label also describes the row's `ItemLink`, or the row itself when it is a menu item. Without it, the icon is decorative.
	 */
	label?: string;
};

export type ItemLinkContract = ItemPartContract;

export type ItemMediaContract = ItemPartContract & {
	/**
	 * `icon` centers its child in a 20px box, for icons and status bullets; `slot` keeps at least that size, so an empty
	 * slot lines up rows with and without an icon.
	 */
	variant?: 'default' | 'icon' | 'slot';
};

export type ItemMetaContract = ItemPartContract & {
	/**
	 * Lets longer trailing text, such as a command description, shrink and end in an ellipsis.
	 */
	truncate?: boolean;
};

export type ItemRowContract = ItemPartContract & {
	/**
	 * Keeps the height of the line when actions sit on it, as in a list whose rows all share one height.
	 */
	fixedHeight?: boolean;
};

export type ItemTitleContract = ItemPartContract & {
	/**
	 * Set to `false` to wrap long text instead of ending it in an ellipsis.
	 */
	truncate?: boolean;
};
