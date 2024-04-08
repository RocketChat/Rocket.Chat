import type { OptionProp } from '@rocket.chat/ui-client';
import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';

export type SearchFilters = {
	searchText: string;
	types: OptionProp[];
};

type SearchFilterContextValue = {
	searchFilters: SearchFilters;
	setSearchFilters: Dispatch<SetStateAction<SearchFilters>>;
};

export const SearchFilterContext = createContext<SearchFilterContextValue>({
	searchFilters: { searchText: '', types: [] },
	setSearchFilters: () => undefined,
});
