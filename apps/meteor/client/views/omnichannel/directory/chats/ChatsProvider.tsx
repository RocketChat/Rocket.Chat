import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import React, { useCallback, useMemo } from 'react';

import { ChatsContext, initialValues } from './ChatsContext';
import { useDisplayFilters } from './useDisplayFilters';

type ChatsProviderProps = {
	children: ReactNode;
};

const ChatsProvider = ({ children }: ChatsProviderProps) => {
	const [filtersQuery, setFiltersQuery] = useLocalStorage('conversationsQuery', initialValues);
	const displayFilters = useDisplayFilters(filtersQuery);
	const hasAppliedFilters = Object.values(displayFilters).filter((value) => value !== undefined).length > 0;

	const resetFiltersQuery = useCallback(
		() =>
			setFiltersQuery((prevState) => {
				const customFields = Object.keys(prevState).filter((item) => !Object.keys(initialValues).includes(item));

				const initialCustomFields = customFields.reduce((acc, cv) => {
					acc[cv] = '';
					return acc;
				}, {} as { [key: string]: string });

				return { ...initialValues, ...initialCustomFields };
			}),
		[setFiltersQuery],
	);

	const removeFilter = useCallback(
		(filter: keyof typeof initialValues) => setFiltersQuery((prevState) => ({ ...prevState, [filter]: initialValues[filter] })),
		[setFiltersQuery],
	);

	const contextValue = useMemo(
		() => ({
			filtersQuery,
			setFiltersQuery,
			resetFiltersQuery,
			displayFilters,
			removeFilter,
			hasAppliedFilters,
		}),
		[displayFilters, filtersQuery, hasAppliedFilters, removeFilter, resetFiltersQuery, setFiltersQuery],
	);

	return <ChatsContext.Provider children={children} value={contextValue} />;
};

export default ChatsProvider;
