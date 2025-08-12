import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';

import { ChatsContext, initialValues } from '../contexts/ChatsContext';
import { useDisplayFilters } from '../hooks/useDisplayFilters';

type ChatsProviderProps = {
	children: ReactNode;
};

const ChatsProvider = ({ children }: ChatsProviderProps) => {
	const textInputRef = useRef<HTMLInputElement>(null);
	const [filtersQuery, setFiltersQuery] = useLocalStorage('newConversationsQuery', initialValues);
	const displayFilters = useDisplayFilters(filtersQuery);

	const contextValue = useMemo(
		() => ({
			filtersQuery,
			setFiltersQuery,
			resetFiltersQuery: () =>
				setFiltersQuery((prevState) => {
					const customFields = Object.keys(prevState).filter((item) => !Object.keys(initialValues).includes(item));

					const initialCustomFields = customFields.reduce(
						(acc, cv) => {
							acc[cv] = '';
							return acc;
						},
						{} as { [key: string]: string },
					);

					return { ...initialValues, ...initialCustomFields };
				}),
			displayFilters,
			removeFilter: (filter: keyof typeof initialValues) => {
				if (filter === 'guest' && textInputRef.current) {
					textInputRef.current.focus();
				}
				return setFiltersQuery((prevState) => ({ ...prevState, [filter]: initialValues[filter] }));
			},
			hasAppliedFilters: Object.values(displayFilters).filter((value) => value !== undefined).length > 0,
			textInputRef,
		}),
		[displayFilters, filtersQuery, setFiltersQuery],
	);

	return <ChatsContext.Provider children={children} value={contextValue} />;
};

export default ChatsProvider;
