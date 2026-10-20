import { Item, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';

import { useSearchOptionProps } from './hooks/useSearchActiveOption';

export type NavBarSearchItemProps = {
	title: string;
	avatar: ReactNode;
	icon: ReactNode;
	actions?: ReactNode;
	href?: string;
	unread?: boolean;
	selected?: boolean;
	badges?: ReactNode;
	clickable?: boolean;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const NavBarSearchItem = ({ icon, title, avatar, actions, unread, badges, ...props }: NavBarSearchItemProps) => {
	const optionProps = useSearchOptionProps(props.id);

	return (
		<Item is='a' role='option' inset='md' highlighted={unread} {...props} {...optionProps}>
			{avatar && <ItemMedia>{avatar}</ItemMedia>}
			{icon && icon}
			<ItemTitle>{title}</ItemTitle>
			{badges && badges}
			{actions && actions}
		</Item>
	);
};

export default NavBarSearchItem;
