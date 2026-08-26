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
	/**
	 * What this item *says*, for an item whose `content` is rendered rather than plain text.
	 *
	 * The collection underneath needs a string to match typeahead against and to announce, and it cannot read one
	 * out of arbitrary JSX — without it, it warns per item ("unsupported by type to select for accessibility") and
	 * the item is unreachable by typing its name.
	 */
	textValue?: string;
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
