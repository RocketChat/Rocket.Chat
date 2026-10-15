import { createContext, useContext } from 'react';

export type ItemContextValue = {
	descriptionIds: string[];
	registerDescription: (id: string) => () => void;
};

export const ItemContext = createContext<ItemContextValue>({
	descriptionIds: [],
	registerDescription: () => () => undefined,
});

export const useItemContext = () => useContext(ItemContext);
