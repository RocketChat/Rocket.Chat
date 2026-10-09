import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Box, SidebarItem, SidebarItemIcon, SidebarItemTitle } from '@rocket.chat/fuselage';
import type { KeyboardEvent, ReactElement, SyntheticEvent } from 'react';

import NavBarSearchFilterSuggestionIcon from './NavBarSearchFilterSuggestionIcon';
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

	const handleKeyDown = (event: KeyboardEvent, suggestion: SearchFilterSuggestion) => {
		if (event.key === 'Enter') {
			handleSelect(event, suggestion);
		}
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
						user={item.user}
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
						{item.description && (
							<Box color='hint' fontScale='c1' flexShrink={0}>
								{item.description}
							</Box>
						)}
					</SidebarItem>
				),
			)}
		</Box>
	);
};

export default NavBarSearchFilterSuggestions;
