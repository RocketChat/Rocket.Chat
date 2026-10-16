import { createContext, useContext } from 'react';

export type ItemContextValue = {
	/**
	 * The row's own role, when it is a widget such as an option or a menu item.
	 */
	role?: string;
	titleIds: string[];
	descriptionIds: string[];
	registerDescription: (id: string) => () => void;
	registerTitle: (id: string) => () => void;
};

export const ItemContext = createContext<ItemContextValue>({
	titleIds: [],
	descriptionIds: [],
	registerDescription: () => () => undefined,
	registerTitle: () => () => undefined,
});

export const useItemContext = () => useContext(ItemContext);
