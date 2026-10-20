import { createContext, useContext } from 'react';

export type ItemGroupContextValue = {
	titleId?: string;
	claimTitleId: (callerId: string) => string | undefined;
	registerTitle: (id: string) => () => void;
};

export const ItemGroupContext = createContext<ItemGroupContextValue>({
	titleId: undefined,
	claimTitleId: () => undefined,
	registerTitle: () => () => undefined,
});

export const useItemGroupContext = () => useContext(ItemGroupContext);
