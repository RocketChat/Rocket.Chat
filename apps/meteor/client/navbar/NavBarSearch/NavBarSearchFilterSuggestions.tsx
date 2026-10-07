import type { SearchFilterGroup, SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Box, SidebarItem, SidebarItemIcon, SidebarItemTitle } from '@rocket.chat/fuselage';
import type { KeyboardEvent, ReactElement, SyntheticEvent } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterSuggestionIcon from './NavBarSearchFilterSuggestionIcon';
import NavBarSearchFilterUserSuggestion from './NavBarSearchFilterUserSuggestion';
import { useSearchFilters } from './hooks/useSearchFilters';

const filterSuggestionGroupLabels = {
	rooms: 'Search_filter_rooms',
	users: 'Search_filter_users',
	dates: 'Search_filter_dates',
} as const;

export type NavBarSearchFilterSuggestionsProps = {
	suggestions: SearchFilterSuggestion[];
};

const groupFilterSuggestions = (suggestions: SearchFilterSuggestion[]): [SearchFilterGroup, SearchFilterSuggestion[]][] => {
	const grouped: Record<SearchFilterGroup, SearchFilterSuggestion[]> = { rooms: [], users: [], dates: [] };
	for (const suggestion of suggestions) {
		grouped[suggestion.group].push(suggestion);
	}

	const groups: [SearchFilterGroup, SearchFilterSuggestion[]][] = [];
	for (const group of ['rooms', 'users', 'dates'] as const) {
		if (grouped[group].length > 0) {
			groups.push([group, grouped[group]]);
		}
	}

	return groups;
};

const NavBarSearchFilterSuggestions = ({ suggestions }: NavBarSearchFilterSuggestionsProps): ReactElement | null => {
	const { t } = useTranslation();
	const { acceptSuggestion } = useSearchFilters();
	const filterSuggestionGroups = useMemo(() => groupFilterSuggestions(suggestions), [suggestions]);

	const handleSelect = (event: SyntheticEvent, suggestion: SearchFilterSuggestion) => {
		event.preventDefault();
		event.stopPropagation();
		acceptSuggestion(suggestion);
	};

	const handleKeyDown = (event: KeyboardEvent, suggestion: SearchFilterSuggestion) => {
		if (event.key === 'Enter') {
			handleSelect(event, suggestion);
		}
	};

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
					{groupSuggestions.map((item) =>
						item.user ? (
							<NavBarSearchFilterUserSuggestion
								key={item.key}
								user={item.user}
								description={item.description}
								tabIndex={-1}
								onClick={(event) => handleSelect(event, item)}
								onKeyDown={(event) => handleKeyDown(event, item)}
							/>
						) : (
							<SidebarItem
								key={item.key}
								role='option'
								tabIndex={-1}
								onClick={(event) => handleSelect(event, item)}
								onKeyDown={(event) => handleKeyDown(event, item)}
							>
								<SidebarItemIcon icon={<NavBarSearchFilterSuggestionIcon suggestion={item} />} />
								<SidebarItemTitle>{item.title}</SidebarItemTitle>
								<Box color='hint' fontScale='c1' flexShrink={0}>
									{item.description}
								</Box>
							</SidebarItem>
						),
					)}
				</Box>
			))}
		</>
	);
};

export default NavBarSearchFilterSuggestions;
