import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { ItemMeta, SidebarItem, SidebarItemIcon, SidebarItemTitle } from '@rocket.chat/fuselage';
import type { SyntheticEvent } from 'react';

import NavBarSearchFilterSuggestionIcon from './NavBarSearchFilterSuggestionIcon';
import { useSearchOptionProps } from './hooks/useSearchActiveOption';

type NavBarSearchFilterSuggestionOptionProps = {
	item: SearchFilterSuggestion;
	onSelect: (event: SyntheticEvent, suggestion: SearchFilterSuggestion) => void;
};

const NavBarSearchFilterSuggestionOption = ({ item, onSelect }: NavBarSearchFilterSuggestionOptionProps) => {
	const optionProps = useSearchOptionProps(`search-filter-${item.key}`);

	return (
		<SidebarItem role='option' {...optionProps} onClick={(event) => onSelect(event, item)}>
			<SidebarItemIcon icon={<NavBarSearchFilterSuggestionIcon suggestion={item} />} />
			<SidebarItemTitle>{item.title}</SidebarItemTitle>
			{item.description && (
				<ItemMeta truncate title={item.description}>
					{item.description}
				</ItemMeta>
			)}
		</SidebarItem>
	);
};

export default NavBarSearchFilterSuggestionOption;
