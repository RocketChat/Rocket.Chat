import { createContext, useContext } from 'react';

export type ItemContextValue = {
	descriptionIds: string[];
	registerDescription: (id: string) => () => void;
	registerTitle: (id: string) => () => void;
	/** What the row's parts restyle themselves from, where a rule on the row can no longer reach them. */
	highlighted: boolean;
	grabbable: boolean;
	dragging: boolean;
	/** Whether the gap between the row's slots is the wide one, which hidden actions pull in. */
	wide: boolean;
	/** What an `ItemContent` the row could not see tells it: whether it holds more than one line. Absent when the row knows. */
	reportLines?: (lines: boolean) => () => void;
};

export const ItemContext = createContext<ItemContextValue>({
	descriptionIds: [],
	registerDescription: () => () => undefined,
	registerTitle: () => () => undefined,
	highlighted: false,
	grabbable: false,
	dragging: false,
	wide: false,
});

export const useItemContext = () => useContext(ItemContext);

/**
 * Where the actions of a row sit: on one of its lines, and whether the lines must keep their height, or `detached`, away
 * from the row's own slots. Without one they are a slot of the row or of a group header. Hidden actions pull in the gap
 * in front of them only as a slot or on a line, and only on a line do they overhang it.
 */
export const ItemRowContext = createContext<{ fixedHeight: boolean } | 'detached' | null>(null);

/**
 * What a menu inside the actions of a row reports its open state to, so the actions stay shown while the menu is open
 * and the focus has left the row. Only a row's hidden actions provide it.
 */
export const ItemActionsContext = createContext<((open: boolean) => void) | undefined>(undefined);

/** What a group title that is a button tells its header, which then reacts to the pointer as a row with a target does. */
export const ItemGroupHeaderContext = createContext<(() => () => void) | undefined>(undefined);
