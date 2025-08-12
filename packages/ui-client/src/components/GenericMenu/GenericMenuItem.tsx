import { MenuItemColumn, MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';

export type GenericMenuItemProps = {
	id: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	iconColor?: ComponentProps<typeof MenuItemIcon>['color'];
	content?: ReactNode;
	addon?: ReactNode;
	onClick?: (e?: MouseEvent<HTMLElement>) => void;
	status?: ReactNode;
	disabled?: boolean;
	description?: ReactNode;
	gap?: boolean;
	tooltip?: string;
	variant?: string;
};

const GenericMenuItem = ({ icon, iconColor, content, addon, status, gap, tooltip }: GenericMenuItemProps) => (
	<>
		{gap && <MenuItemColumn />}
		{icon && <MenuItemIcon name={icon} color={iconColor} />}
		{status && <MenuItemColumn>{status}</MenuItemColumn>}
		{content && <MenuItemContent title={tooltip}>{content}</MenuItemContent>}
		{addon && <MenuItemInput>{addon}</MenuItemInput>}
	</>
);

export default GenericMenuItem;
