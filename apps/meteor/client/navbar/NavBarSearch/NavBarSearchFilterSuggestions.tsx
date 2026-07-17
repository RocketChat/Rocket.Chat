import {
	emptySearchFilters,
	mergeSearchFilters,
	parseSearchFilterText,
	type NavBarSearchFormValues,
	type SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { Box, Icon, SidebarV2Item, SidebarV2ItemIcon, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
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
					<Box color='titles-labels' fontScale='c1' fontWeight='bold' paddingInline={12} marginBlockEnd={4} role='presentation' aria-hidden>
						{t(filterSuggestionGroupLabels[group])}
					</Box>
					{groupSuggestions.map((item) => (
						<SidebarV2Item key={item.key} role='option' onClick={(event) => handleFilterSuggestion(event, item.value)}>
							<SidebarV2ItemIcon icon={<Icon name={item.icon} size='x16' />} />
							<SidebarV2ItemTitle>{item.title}</SidebarV2ItemTitle>
							<Box color='hint' fontScale='c1' flexShrink={0}>
								{item.description}
							</Box>
						</SidebarV2Item>
					))}
				</Box>
			))}
		</>
	);
};

export default NavBarSearchFilterSuggestions;
