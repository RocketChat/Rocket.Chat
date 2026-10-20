import {
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemMeta,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { useDeferredMenuMount, useShortTimeAgo } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo } from 'react';

export type SidePanelItemProps = {
	href: string;
	selected: boolean;
	title: string;
	titleIcon?: ReactNode;
	avatar: ReactNode;
	icon: ReactNode;
	unread: boolean;
	time?: Date;
	subtitle: ReactNode;
	parentRoom?: ReactNode;
	badges?: ReactNode;
	menu?: ReactNode;
};

const SidePanelItem = ({
	href,
	selected,
	title,
	titleIcon,
	avatar,
	icon,
	unread,
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
		<Item
			{...props}
			is='a'
			href={href}
			inset='md'
			onClick={() => !selected && sidebar.toggle()}
			selected={selected}
			highlighted={unread}
			onFocus={mountNow}
			onPointerEnter={requestMount}
			aria-label={title}
			aria-current={selected ? 'page' : undefined}
		>
			<ItemContent>
				<ItemRow>
					{avatar && <ItemMedia>{avatar}</ItemMedia>}
					{icon}
					<ItemTitle>{title}</ItemTitle>
					{time && <ItemMeta>{formatDate(time)}</ItemMeta>}
				</ItemRow>
				<ItemRow>
					<ItemDescription>{subtitle}</ItemDescription>
					{parentRoom}
					{titleIcon}
					{badges}
					{menu && (
						<ItemActions reveal='hover'>
							{menuVisibility ? menu : <IconButton tabIndex={-1} aria-hidden mini icon='kebab' onPointerDown={mountNow} />}
						</ItemActions>
					)}
				</ItemRow>
			</ItemContent>
		</Item>
	);
};

export default memo(SidePanelItem);
