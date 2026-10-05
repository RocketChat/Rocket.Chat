import { Icon, ItemActions, ItemContent, ItemIcon, ItemTitle } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';

export type GenericMenuItemProps = {
	id: string;
	icon?: ComponentProps<typeof Icon>['name'];
	iconColor?: ComponentProps<typeof Icon>['color'];
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
	 * What this item *says*, for an item whose `content` is rendered rather than plain text: the collection needs a
	 * string for typeahead and to announce, and cannot read one out of arbitrary JSX.
	 */
	textValue?: string;
};

const GenericMenuItem = ({ icon, iconColor, content, addon, status, gap, tooltip }: GenericMenuItemProps) => (
	<>
		{gap && <ItemIcon />}
		{icon && (
			<ItemIcon>
				<Icon name={icon} color={iconColor} size='x20' />
			</ItemIcon>
		)}
		{status && <ItemIcon>{status}</ItemIcon>}
		{content && (
			<ItemContent title={tooltip}>
				<ItemTitle>{content}</ItemTitle>
			</ItemContent>
		)}
		{addon && <ItemActions>{addon}</ItemActions>}
	</>
);

export default GenericMenuItem;
