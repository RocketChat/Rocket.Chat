import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Item, ItemIcon, ItemMeta, ItemTitle } from '@rocket.chat/fuselage';
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
		<Item is='a' role='option' inset='md' {...optionProps} onClick={(event) => onSelect(event, item)}>
			<ItemIcon>
				<NavBarSearchFilterSuggestionIcon suggestion={item} />
			</ItemIcon>
			<ItemTitle>{item.title}</ItemTitle>
			{item.description && (
				<ItemMeta truncate title={item.description}>
					{item.description}
				</ItemMeta>
			)}
		</Item>
	);
};

export default NavBarSearchFilterSuggestionOption;
