import { Item, ItemContent, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import type { HTMLAttributes, ReactNode } from 'react';

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
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is' | 'title'>;

const NavBarSearchItem = ({ icon, title, avatar, actions, unread, badges, clickable: _clickable, ...props }: NavBarSearchItemProps) => {
	return (
		<Item is='a' role='option' inset='md' highlighted={unread} {...props}>
			{avatar && <ItemMedia>{avatar}</ItemMedia>}
			{icon}
			<ItemContent>
				<ItemTitle>{title}</ItemTitle>
			</ItemContent>
			{badges}
			{actions}
		</Item>
	);
};

export default NavBarSearchItem;
