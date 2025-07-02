import { Icon, SidebarV2Item, SidebarV2ItemBadge, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import { useButtonPattern } from '@rocket.chat/fuselage-hooks';
import type { Keys as IconName } from '@rocket.chat/icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	type SidePanelFiltersKeys,
	sidePanelFiltersConfig,
	useSidePanelFilter,
} from '../../views/navigation/contexts/RoomsNavigationContext';
import { useUnreadGroupData } from '../../views/navigation/contexts/RoomsNavigationContext';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type SidebarFiltersItemProps = {
	group: SidePanelFiltersKeys;
	icon: IconName;
	onClick: () => void;
};

const RoomListFiltersItem = ({ group, icon, onClick }: SidebarFiltersItemProps) => {
	const { t } = useTranslation();
	const unreadGroupCount = useUnreadGroupData(group);
	const buttonProps = useButtonPattern(onClick);
	const [currentTab] = useSidePanelFilter();
	const roomTitle = sidePanelFiltersConfig[group].title;
	const { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread: highlighted } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarV2Item selected={group === currentTab} {...buttonProps}>
			<Icon size='x20' name={icon} />
			<SidebarV2ItemTitle unread={highlighted}>{t(roomTitle)}</SidebarV2ItemTitle>
			{showUnread && (
				<SidebarV2ItemBadge
					variant={unreadVariant}
					title={unreadTitle}
					role='status'
					aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle })}
				>
					<span aria-hidden>{unreadCount.total}</span>
				</SidebarV2ItemBadge>
			)}
		</SidebarV2Item>
	);
};

export default memo(RoomListFiltersItem);
