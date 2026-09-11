import { Icon, SidebarItem, SidebarItemIcon, SidebarItemTitle } from '@rocket.chat/fuselage';
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

type SidebarFiltersItemProps = {
	group: SidePanelFiltersKeys;
	icon: IconName;
};

const RoomListFiltersItem = ({ group, icon }: SidebarFiltersItemProps) => {
	const { t } = useTranslation();
	const switchSidePanelTab = useSwitchSidePanelTab();

	const unreadGroupCount = useUnreadGroupData(group);
	const buttonProps = useButtonPattern((e) => {
		e.preventDefault();
		switchSidePanelTab(group);
	});
	const [currentTab] = useSidePanelFilter();
	const roomTitle = sidePanelFiltersConfig[group].title;
	const { unreadTitle, showUnread, highlightUnread: highlighted } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarItem
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle }) : roomTitle}
			selected={group === currentTab}
			aria-selected={group === currentTab}
			{...buttonProps}
			role='tab'
		>
			<SidebarItemIcon highlighted={highlighted} icon={<Icon size='x20' name={icon} />} />
			<SidebarItemTitle unread={highlighted}>{t(roomTitle)}</SidebarItemTitle>
			{showUnread && <RoomListFiltersItemBadge roomTitle={roomTitle} unreadGroupCount={unreadGroupCount} />}
		</SidebarItem>
	);
};

export default memo(RoomListFiltersItem);
