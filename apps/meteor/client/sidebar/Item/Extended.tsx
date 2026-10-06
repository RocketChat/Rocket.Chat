import {
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { useShortTimeAgo } from '@rocket.chat/ui-client';
import type { AriaAttributes, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from './useDeferredMenuMount';

export type ExtendedProps = {
	'icon'?: ReactNode;
	'title': ReactNode;
	'avatar'?: ReactNode;
	'actions'?: ReactNode;
	'href'?: string;
	'time'?: any;
	'menu'?: () => ReactNode;
	'subtitle'?: ReactNode;
	'badges'?: ReactNode;
	'unread'?: boolean;
	'selected'?: boolean;
	'menuOptions'?: any;
	'titleIcon'?: ReactNode;
	'threadUnread'?: boolean;
	'onClick'?: MouseEventHandler<HTMLAnchorElement>;
	'aria-current'?: AriaAttributes['aria-current'];
} & Omit<HTMLAttributes<HTMLElement>, 'is' | 'title' | 'onClick'>;

const Extended = ({
	icon,
	title,
	avatar,
	actions,
	href = '',
	time,
	menu,
	'menuOptions': _menuOptions,
	subtitle = '',
	titleIcon,
	badges,
	'threadUnread': _threadUnread,
	unread,
	selected,
	onClick,
	'aria-label': ariaLabel,
	'aria-current': ariaCurrent,
	...props
}: ExtendedProps) => {
	const formatDate = useShortTimeAgo();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<Item {...props} selected={selected} highlighted={unread} onFocus={mountNow} onPointerEnter={requestMount}>
			{avatar && <ItemMedia>{avatar}</ItemMedia>}
			<ItemContent>
				<ItemRow>
					{icon}
					<ItemTitle>
						<ItemLink href={href} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
							{title}
						</ItemLink>
					</ItemTitle>
					{time && <ItemMeta>{formatDate(time)}</ItemMeta>}
				</ItemRow>
				<ItemRow>
					<ItemDescription>{subtitle}</ItemDescription>
					{titleIcon}
					{badges}
					{actions}
					{menu && (
						<ItemActions reveal='hover'>
							{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />}
						</ItemActions>
					)}
				</ItemRow>
			</ItemContent>
		</Item>
	);
};

export default memo(Extended);
