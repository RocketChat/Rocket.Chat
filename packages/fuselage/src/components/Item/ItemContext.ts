import { createContext, useContext } from 'react';

export type ItemContextValue = {
	titleId?: string;
	descriptionId?: string;
	descriptionIds: string[];
	registerDescription: (id: string) => () => void;
	registerTitle: (id: string) => () => void;
};

export const ItemContext = createContext<ItemContextValue>({
	descriptionIds: [],
	registerDescription: () => () => undefined,
	registerTitle: () => () => undefined,
});

export const useItemContext = () => useContext(ItemContext);
