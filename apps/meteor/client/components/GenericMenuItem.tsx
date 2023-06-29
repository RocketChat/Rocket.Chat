import { MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

export type GenericMenuItemProps = {
	id?: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	content?: ReactNode;
	addon?: ReactNode;
	onClick?: () => void;
};

const GenericMenuItem = ({ icon, content, addon }: GenericMenuItemProps) => (
	<>
		{icon && <MenuItemIcon name={icon} />}
		{content && <MenuItemContent>{content}</MenuItemContent>}
		{addon && <MenuItemInput>{addon}</MenuItemInput>}
	</>
);

export default GenericMenuItem;
