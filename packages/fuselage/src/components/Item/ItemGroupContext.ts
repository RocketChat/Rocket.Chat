import { createContext, useContext } from 'react';

import type { ItemDensity } from './types';

export type ItemGroupContextValue = {
	registerTitle: (id: string) => () => void;
	/**
	 * How deep the group sits: 0 for a top-level group, 1 for a group nested in one of its rows, and so on.
	 */
	depth: number;
	density: ItemDensity;
};

export const ItemGroupContext = createContext<ItemGroupContextValue>({
	registerTitle: () => () => undefined,
	depth: -1,
	density: 'compact',
});

export const useItemGroupContext = () => useContext(ItemGroupContext);
