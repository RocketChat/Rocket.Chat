import { createContext, useContext } from 'react';

export type ItemGroupContextValue = {
	registerTitle: (id: string) => () => void;
};

export const ItemGroupContext = createContext<ItemGroupContextValue>({
	registerTitle: () => () => undefined,
});

export const useItemGroupContext = () => useContext(ItemGroupContext);
