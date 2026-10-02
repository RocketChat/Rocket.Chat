import { Icon, Item, ItemContent, ItemIcon, ItemTitle } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import RoomListFiltersItemBadge from './RoomListFiltersItemBadge';
import {
	type SidePanelFiltersKeys,
	sidePanelFiltersConfig,
	useSidePanelFilter,
	useSwitchSidePanelTab,
} from '../../contexts/RoomsNavigationContext';
import { useUnreadGroupData } from '../../contexts/RoomsNavigationContext';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

export type RoomListFiltersItemProps = {
	group: SidePanelFiltersKeys;
	icon: IconName;
};

const RoomListFiltersItem = ({ group, icon }: RoomListFiltersItemProps) => {
	const { t } = useTranslation();
	const switchSidePanelTab = useSwitchSidePanelTab();

	const unreadGroupCount = useUnreadGroupData(group);
	const buttonProps = useButtonPattern((e) => {
		e.preventDefault();
		switchSidePanelTab(group);
	});
	const [currentTab] = useSidePanelFilter();
	const roomTitle = t(sidePanelFiltersConfig[group].title);
	const { unreadTitle, showUnread, highlightUnread: highlighted } = useUnreadDisplay(unreadGroupCount);
	const selected = group === currentTab;

	return (
		<Item
			{...buttonProps}
			is='div'
			role='tab'
			selected={selected}
			highlighted={highlighted}
			aria-selected={selected}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle }) : roomTitle}
		>
			<ItemIcon label={roomTitle}>
				<Icon size='x20' name={icon} />
			</ItemIcon>
			<ItemContent>
				<ItemTitle>{roomTitle}</ItemTitle>
			</ItemContent>
			{showUnread && <RoomListFiltersItemBadge roomTitle={roomTitle} unreadGroupCount={unreadGroupCount} />}
		</Item>
	);
};

export default memo(RoomListFiltersItem);
