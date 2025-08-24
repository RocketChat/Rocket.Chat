import { Icon, SidebarV2Item, SidebarV2ItemIcon, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
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
} from '../../views/navigation/contexts/RoomsNavigationContext';
import { useUnreadGroupData } from '../../views/navigation/contexts/RoomsNavigationContext';
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
		<SidebarV2Item
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle }) : roomTitle}
			selected={group === currentTab}
			aria-selected={group === currentTab}
			{...buttonProps}
		>
			<SidebarV2ItemIcon highlighted={highlighted} icon={<Icon size='x20' name={icon} />} />
			<SidebarV2ItemTitle unread={highlighted}>{t(roomTitle)}</SidebarV2ItemTitle>
			{showUnread && <RoomListFiltersItemBadge roomTitle={roomTitle} unreadGroupCount={unreadGroupCount} />}
		</SidebarV2Item>
	);
};

export default memo(RoomListFiltersItem);
