import { VisuallyHidden } from '@react-aria/visually-hidden';
import { MenuItemColumn, MenuItemContent, MenuItemIcon, MenuItemInput } from '@rocket.chat/fuselage';
import type { ComponentProps, MouseEvent, ReactNode } from 'react';

type GenericMenuItemFields = {
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
	 * What this item *says*, for an item whose `content` is rendered rather than plain text: the collection needs a
	 * string for typeahead and to announce, and cannot read one out of arbitrary JSX.
	 */
	textValue?: string;
	/**
	 * What the item is announced as in place of its `content`, for a row that shows more than its `content` says,
	 * such as a status. It has no effect on an item that has no `content`.
	 */
	label?: string;
};

/** An entry of an item's sub menu, which cannot open a sub menu of its own. */
export type GenericMenuSubItemProps = GenericMenuItemFields & { items?: never };

export type GenericMenuItemProps = GenericMenuItemFields & {
	/** Entries of a sub menu this item opens instead of acting on its own. */
	items?: GenericMenuSubItemProps[];
};

const GenericMenuItem = ({ icon, iconColor, content, addon, status, gap, tooltip, label }: GenericMenuItemProps) => (
	<>
		{gap && <MenuItemColumn />}
		{icon && <MenuItemIcon name={icon} color={iconColor} />}
		{status && <MenuItemColumn>{status}</MenuItemColumn>}
		{content && (
			<MenuItemContent title={tooltip}>
				{label ? (
					<>
						<span aria-hidden='true'>{content}</span>
						<VisuallyHidden>{label}</VisuallyHidden>
					</>
				) : (
					content
				)}
			</MenuItemContent>
		)}
		{addon && <MenuItemInput>{addon}</MenuItemInput>}
	</>
);

export default GenericMenuItem;
