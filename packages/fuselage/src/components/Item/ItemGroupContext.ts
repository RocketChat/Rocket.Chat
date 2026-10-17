import { createContext, useContext } from 'react';

export type ItemGroupContextValue = {
	titleId?: string;
	registerTitle: (id: string) => () => void;
};

export const ItemGroupContext = createContext<ItemGroupContextValue>({
	titleId: undefined,
	registerTitle: () => () => undefined,
});

export const useItemGroupContext = () => useContext(ItemGroupContext);
