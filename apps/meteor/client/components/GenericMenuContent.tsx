import { MenuItemColumn, MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
import React from 'react';

import type { Item } from '../sidebar/header/actions/hooks/useSortModeItems';

const GenericMenuContent = ({ item }: { item: Item }) => (
	<>
		{item.icon && <MenuItemIcon name={item.icon} />}
		<MenuItemContent>{item.name || item.content}</MenuItemContent>
		{item.input && <MenuItemInput>{item.input}</MenuItemInput>}
		{item.badge && <MenuItemColumn>{item.badge}</MenuItemColumn>}
	</>
);

export default GenericMenuContent;
