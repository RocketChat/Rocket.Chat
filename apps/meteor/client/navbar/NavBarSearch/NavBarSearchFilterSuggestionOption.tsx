import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Icon, Item, ItemIcon, ItemMeta, ItemTitle } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';

import { useSearchOptionProps } from './hooks/useSearchActiveOption';

type NavBarSearchFilterSuggestionOptionProps = {
	item: SearchFilterSuggestion;
	onSelect: (event: MouseEvent, value: string) => void;
};

const NavBarSearchFilterSuggestionOption = ({ item, onSelect }: NavBarSearchFilterSuggestionOptionProps) => {
	const optionProps = useSearchOptionProps(`search-filter-${item.key}`);

	return (
		<Item is='a' role='option' inset='md' {...optionProps} onClick={(event) => onSelect(event, item.value)}>
			<ItemIcon>
				<Icon name={item.icon} size='x16' />
			</ItemIcon>
			<ItemTitle>{item.title}</ItemTitle>
			<ItemMeta truncate title={item.description}>
				{item.description}
			</ItemMeta>
		</Item>
	);
};

export default NavBarSearchFilterSuggestionOption;
