import {
	emptySearchFilters,
	mergeSearchFilters,
	parseSearchFilterText,
	type NavBarSearchFormValues,
	type SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { Box, Icon, Item, ItemContent, ItemGroupHeader, ItemGroupTitle, ItemIcon, ItemMeta, ItemTitle } from '@rocket.chat/fuselage';
import type { MouseEvent, ReactElement } from 'react';
import { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

const filterSuggestionGroupLabels = {
	rooms: 'Search_filter_rooms',
	users: 'Search_filter_users',
	dates: 'Search_filter_dates',
} as const;

export type NavBarSearchFilterSuggestionsProps = {
	suggestions: SearchFilterSuggestion[];
};

const groupFilterSuggestions = (suggestions: SearchFilterSuggestion[]): [SearchFilterSuggestion['group'], SearchFilterSuggestion[]][] => {
	const grouped: Record<SearchFilterSuggestion['group'], SearchFilterSuggestion[]> = { rooms: [], users: [], dates: [] };
	for (const suggestion of suggestions) {
		grouped[suggestion.group].push(suggestion);
	}

	const groups: [SearchFilterSuggestion['group'], SearchFilterSuggestion[]][] = [];
	for (const group of ['rooms', 'users', 'dates'] as const) {
		if (grouped[group].length > 0) {
			groups.push([group, grouped[group]]);
		}
	}

	return groups;
};

const NavBarSearchFilterSuggestions = ({ suggestions }: NavBarSearchFilterSuggestionsProps): ReactElement | null => {
	const { t } = useTranslation();
	const { getValues, setFocus, setValue } = useFormContext<NavBarSearchFormValues>();
	const filterSuggestionGroups = useMemo(() => groupFilterSuggestions(suggestions), [suggestions]);

	const handleFilterSuggestion = useCallback(
		(event: MouseEvent, value: string) => {
			event.preventDefault();
			event.stopPropagation();
			const { searchText, filters } = parseSearchFilterText(value);
			const appliedFilters = getValues('appliedFilters') ?? emptySearchFilters();
			setValue('appliedFilters', mergeSearchFilters(appliedFilters, filters), { shouldDirty: true });
			setValue('filterText', searchText, { shouldDirty: true });
			setFocus('filterText');
		},
		[getValues, setFocus, setValue],
	);

	if (!filterSuggestionGroups.length) {
		return null;
	}

	return (
		<>
			{filterSuggestionGroups.map(([group, groupSuggestions]) => (
				<Box key={group} display='flex' flexDirection='column' paddingBlockStart={8}>
					<ItemGroupHeader inset='md' aria-hidden>
						<ItemGroupTitle>{t(filterSuggestionGroupLabels[group])}</ItemGroupTitle>
					</ItemGroupHeader>
					{groupSuggestions.map((item) => (
						<Item key={item.key} is='a' role='option' inset='md' onClick={(event) => handleFilterSuggestion(event, item.value)}>
							<ItemIcon>
								<Icon name={item.icon} size='x16' />
							</ItemIcon>
							<ItemContent>
								<ItemTitle>{item.title}</ItemTitle>
							</ItemContent>
							<ItemMeta>{item.description}</ItemMeta>
						</Item>
					))}
				</Box>
			))}
		</>
	);
};

export default NavBarSearchFilterSuggestions;
