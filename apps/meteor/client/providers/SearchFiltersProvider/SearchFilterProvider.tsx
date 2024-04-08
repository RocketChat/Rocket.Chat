import type { FC, ReactNode } from 'react';
import React, { useState } from 'react';

import type { SearchFilters } from '../../contexts/SearchFilterContext';
import { SearchFilterContext } from '../../contexts/SearchFilterContext';

type SearchFilterProviderProps = {
	children: ReactNode;
	initialState?: SearchFilters;
};

export const SearchFilterProvider: FC<SearchFilterProviderProps> = ({ children, initialState }) => {
	const [searchFilters, setSearchFilters] = useState<SearchFilters>(initialState || { searchText: '', types: [] });

	return <SearchFilterContext.Provider value={{ searchFilters, setSearchFilters }}>{children}</SearchFilterContext.Provider>;
};
