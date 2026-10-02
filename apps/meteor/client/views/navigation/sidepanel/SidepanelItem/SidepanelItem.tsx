import {
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemIcon,
	ItemLink,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { useShortTimeAgo } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo } from 'react';

import { useDeferredMenuMount } from '../../../../sidebar/Item/useDeferredMenuMount';

type SidePanelItemIconProps =
	| {
			/** Room type icon or user status, shown before the title. */
			icon: ReactNode;
			/** What the icon conveys, such as "Private channel" or "Away". */
			iconLabel: string;
	  }
	| { icon?: undefined; iconLabel?: undefined };

export type SidePanelItemProps = {
	href: string;
	selected: boolean;
	title: string;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	highlighted: boolean;
	time?: Date;
	subtitle: ReactNode;
	parentRoom?: ReactNode;
	badges?: ReactNode;
	menu?: ReactNode;
} & SidePanelItemIconProps;

const SidePanelItem = ({
	href,
	selected,
	title,
	titleIcon,
	avatar,
	icon,
	iconLabel,
	highlighted,
	time,
	subtitle,
	parentRoom,
	badges,
	menu,
	...props
}: SidePanelItemProps) => {
	const { sidebar } = useLayout();
	const formatDate = useShortTimeAgo();
	const { mounted: menuVisibility, requestMount, mountNow } = useDeferredMenuMount();

	return (
		<Item {...props} size='extended' selected={selected} highlighted={highlighted} onFocus={mountNow} onPointerEnter={requestMount}>
			<ItemMedia>{avatar}</ItemMedia>
			<ItemContent>
				<ItemRow>
					{icon && <ItemIcon label={iconLabel}>{icon}</ItemIcon>}
					<ItemTitle>
						<ItemLink href={href} onClick={() => !selected && sidebar.toggle()} aria-current={selected ? 'page' : undefined}>
							{title}
						</ItemLink>
					</ItemTitle>
					{time && <ItemMeta>{formatDate(time)}</ItemMeta>}
				</ItemRow>
				<ItemRow>
					<ItemDescription>{subtitle}</ItemDescription>
					{parentRoom}
					{titleIcon}
					{badges}
				</ItemRow>
			</ItemContent>
			{menu && (
				<ItemActions reveal='hover'>
					{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />}
				</ItemActions>
			)}
		</Item>
	);
};

export default memo(SidePanelItem);
