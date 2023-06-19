import { MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

type GenericMenuContentProps = {
	item: {
		icon?: ComponentProps<typeof MenuItemIcon>['name'];
		name?: string;
		input?: ReactNode;
		content?: ReactNode;
	};
};
const GenericMenuContent = ({ item }: GenericMenuContentProps) => (
	<>
		{item.icon && <MenuItemIcon name={item.icon} />}
		<MenuItemContent>{item.name || item.content}</MenuItemContent>
		{item.input && <MenuItemInput>{item.input}</MenuItemInput>}
	</>
);

export default GenericMenuContent;
