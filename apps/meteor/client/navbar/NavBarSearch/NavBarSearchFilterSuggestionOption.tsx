import type { SearchFilterSuggestion } from '@rocket.chat/ai-search';
import { Icon, ItemMeta, SidebarItem, SidebarItemIcon, SidebarItemTitle } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';

import { useSearchOptionProps } from './hooks/useSearchActiveOption';

type NavBarSearchFilterSuggestionOptionProps = {
	item: SearchFilterSuggestion;
	onSelect: (event: MouseEvent, value: string) => void;
};

const NavBarSearchFilterSuggestionOption = ({ item, onSelect }: NavBarSearchFilterSuggestionOptionProps) => {
	const optionProps = useSearchOptionProps(`search-filter-${item.key}`);

	return (
		<SidebarItem role='option' {...optionProps} onClick={(event) => onSelect(event, item.value)}>
			<SidebarItemIcon icon={<Icon name={item.icon} size='x16' />} />
			<SidebarItemTitle>{item.title}</SidebarItemTitle>
			<ItemMeta truncate title={item.description}>
				{item.description}
			</ItemMeta>
		</SidebarItem>
	);
};

export default NavBarSearchFilterSuggestionOption;
