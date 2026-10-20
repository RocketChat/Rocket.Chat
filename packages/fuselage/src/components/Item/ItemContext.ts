import { createContext, useContext } from 'react';

import type { ItemHighlight } from './itemStyles';

export type ItemContextValue = {
	descriptionIds: string[];
	registerDescription: (id: string) => () => void;
	registerTitle: (id: string) => () => void;
	registerLink: (id: string) => () => void;
	registerMultiline: (id: string) => () => void;
};

/** What a part gets when nothing reads what it would register, so it can skip the work that finds it out. */
export const skipRegistration = () => () => undefined;

export const ItemContext = createContext<ItemContextValue>({
	descriptionIds: [],
	registerDescription: skipRegistration,
	registerTitle: skipRegistration,
	registerLink: skipRegistration,
	registerMultiline: skipRegistration,
});

export const useItemContext = () => useContext(ItemContext);

/** The emphasis an `Item` row hands to its title, icon, description and meta. */
export const ItemHighlightContext = createContext<ItemHighlight | undefined>(undefined);

/** The row an `ItemActions` sits directly in, which decides how it overhangs and how much gap it cancels while hidden. */
export type ItemParent = { kind: 'item' | 'row' | 'header'; gap: 'x4' | 'x8' } | undefined;

export const ItemParentContext = createContext<ItemParent>(undefined);

/** Lets an `ItemGroupTitle` rendered as a button tell its header to show the hover surface. */
export const ItemGroupHeaderContext = createContext<(id: string) => () => void>(() => () => undefined);
