import { createContext, useContext } from 'react';

export type ItemContextValue = {
	descriptionIds: string[];
	registerDescription: (id: string) => () => void;
	registerTitle: (id: string) => () => void;
	/** What the row's parts restyle themselves from, where a rule on the row can no longer reach them. */
	highlighted: boolean;
	grabbable: boolean;
	dragging: boolean;
};

export const ItemContext = createContext<ItemContextValue>({
	descriptionIds: [],
	registerDescription: () => () => undefined,
	registerTitle: () => () => undefined,
	highlighted: false,
	grabbable: false,
	dragging: false,
});

export const useItemContext = () => useContext(ItemContext);

/**
 * Tells the actions of a row that they sit on one of its lines, and whether the lines must keep their height. A wrapper between
 * the row and its actions provides `detached`, as their being the row's direct children is what the overhang and the pulled-in
 * margin of hidden actions depend on.
 */
export const ItemRowContext = createContext<{ fixedHeight: boolean } | 'detached' | null>(null);

/**
 * What the menus inside the actions of a row report their open state to, so the actions stay shown while the menu is open and
 * the focus has left the row. Only a row's hidden actions provide it.
 */
export const ItemActionsContext = createContext<((open: boolean) => void) | undefined>(undefined);

export const useReportOpen = () => useContext(ItemActionsContext);
