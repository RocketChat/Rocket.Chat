import { MenuItemColumn, MenuItemContent, MenuItemIcon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

export type GenericMenuItem = {
	id: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	content?: ReactNode;
	addon?: ReactNode;
	onClick?: () => void;
};

const GenericMenuContent = ({ icon, content, addon }: GenericMenuItem) => (
	<>
		{icon && <MenuItemIcon name={icon} />}
		{content && <MenuItemContent>{content}</MenuItemContent>}
		{addon && <MenuItemColumn>{addon}</MenuItemColumn>}
	</>
);

export default GenericMenuContent;
