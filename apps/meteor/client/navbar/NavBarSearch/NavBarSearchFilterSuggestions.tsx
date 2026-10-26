import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement, SyntheticEvent } from 'react';

import NavBarSearchFilterSuggestionOption from './NavBarSearchFilterSuggestionOption';
import NavBarSearchFilterUserSuggestion from './NavBarSearchFilterUserSuggestion';
import { useSearchFilters } from './hooks/useSearchFilters';

export type NavBarSearchFilterSuggestionsProps = {
	suggestions: SearchFilterSuggestion[];
};

const NavBarSearchFilterSuggestions = ({ suggestions }: NavBarSearchFilterSuggestionsProps): ReactElement | null => {
	const { acceptSuggestion } = useSearchFilters();

	const handleSelect = (event: SyntheticEvent, suggestion: SearchFilterSuggestion) => {
		event.preventDefault();
		event.stopPropagation();
		acceptSuggestion(suggestion);
	};

	if (!suggestions.length) {
		return null;
	}

	return (
		<Box display='flex' flexDirection='column' paddingBlockStart={8}>
			{suggestions.map((item) =>
				item.user ? (
					<NavBarSearchFilterUserSuggestion
						key={item.key}
						id={`search-filter-${item.key}`}
						user={item.user}
						onClick={(event) => handleSelect(event, item)}
					/>
				) : (
					<NavBarSearchFilterSuggestionOption key={item.key} item={item} onSelect={handleSelect} />
				),
			)}
		</Box>
	);
};

export default NavBarSearchFilterSuggestions;
