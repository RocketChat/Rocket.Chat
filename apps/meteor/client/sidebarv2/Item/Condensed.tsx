import { IconButton, SidebarV2Item, SidebarV2ItemAvatarWrapper, SidebarV2ItemMenu, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import { usePrefersReducedMotion } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { HTMLAttributes, ReactElement } from 'react';
import { memo, useState } from 'react';

type CondensedProps = {
	title: string;
	titleIcon?: ReactElement;
	avatar: ReactElement | boolean;
	icon?: IconName;
	actions?: ReactElement;
	href?: string;
	unread?: boolean;
	menu?: () => ReactElement;
	menuOptions?: any;
	selected?: boolean;
	badges?: ReactElement;
	clickable?: boolean;
} & Omit<HTMLAttributes<HTMLAnchorElement>, 'is'>;

const Condensed = ({ icon, title, avatar, actions, unread, menu, badges, ...props }: CondensedProps) => {
	const [menuVisibility, setMenuVisibility] = useState(!!window.DISABLE_ANIMATION);
	const isReduceMotionEnabled = usePrefersReducedMotion();

	const handleMenuEvent = {
		[isReduceMotionEnabled ? 'onMouseEnter' : 'onTransitionEnd']: setMenuVisibility,
	};

	return (
		<SidebarV2Item {...props}>
			{avatar && <SidebarV2ItemAvatarWrapper>{avatar}</SidebarV2ItemAvatarWrapper>}
			{icon && icon}
			<SidebarV2ItemTitle unread={unread}>{title}</SidebarV2ItemTitle>
			{badges && badges}
			{actions && actions}
			{menu && (
				<SidebarV2ItemMenu {...handleMenuEvent}>
					{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini rcx-sidebar-v2-item__menu icon='kebab' />}
				</SidebarV2ItemMenu>
			)}
		</SidebarV2Item>
	);
};

export default memo(Condensed);
