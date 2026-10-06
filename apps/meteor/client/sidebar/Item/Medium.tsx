import { IconButton, Item, ItemActions, ItemContent, ItemLink, ItemMedia, ItemRow, ItemTitle } from '@rocket.chat/fuselage';
import type { AriaAttributes, HTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from './useDeferredMenuMount';

export type MediumProps = {
	'title': ReactNode;
	'titleIcon'?: ReactNode;
	'avatar': ReactNode;
	'icon'?: ReactNode;
	'actions'?: ReactNode;
	'href'?: string;
	'unread'?: boolean;
	'menu'?: () => ReactNode;
	'badges'?: ReactNode;
	'selected'?: boolean;
	'menuOptions'?: any;
	'onClick'?: MouseEventHandler<HTMLAnchorElement>;
	'aria-current'?: AriaAttributes['aria-current'];
} & Omit<HTMLAttributes<HTMLElement>, 'is' | 'title' | 'onClick'>;

const Medium = ({
	icon,
	title,
	titleIcon,
	avatar,
	actions,
	badges,
	unread,
	menu,
	href = '',
	selected,
	onClick,
	'aria-label': ariaLabel,
	'aria-current': ariaCurrent,
	'menuOptions': _menuOptions,
	...props
}: MediumProps) => {
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<Item {...props} selected={selected} highlighted={unread} onFocus={mountNow} onPointerEnter={requestMount}>
			{avatar && <ItemMedia>{avatar}</ItemMedia>}
			{icon}
			<ItemContent>
				<ItemRow>
					<ItemTitle>
						<ItemLink href={href} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
							{title}
						</ItemLink>
					</ItemTitle>
					{titleIcon}
				</ItemRow>
			</ItemContent>
			{badges}
			{actions}
			{menu && (
				<ItemActions reveal='hover'>
					{menuVisibility ? menu() : <IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />}
				</ItemActions>
			)}
		</Item>
	);
};

export default memo(Medium);
