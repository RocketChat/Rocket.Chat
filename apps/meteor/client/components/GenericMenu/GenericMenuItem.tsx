import { MenuItemColumn, MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

export type GenericMenuItemProps = {
	id: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	content?: ReactNode;
	addon?: ReactNode;
	onClick?: () => void;
	status?: ReactNode;
	disabled?: boolean;
	description?: ReactNode;
};

const GenericMenuItem = ({ icon, content, addon, status }: GenericMenuItemProps) => (
	<>
		{icon && <MenuItemIcon name={icon} />}
		{status && <MenuItemColumn>{status}</MenuItemColumn>}
		{content && <MenuItemContent>{content}</MenuItemContent>}
		{addon && <MenuItemInput>{addon}</MenuItemInput>}
	</>
);

export default GenericMenuItem;
