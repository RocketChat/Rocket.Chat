import { MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
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
		{addon && <MenuItemInput>{addon}</MenuItemInput>}
	</>
);

export default GenericMenuContent;
