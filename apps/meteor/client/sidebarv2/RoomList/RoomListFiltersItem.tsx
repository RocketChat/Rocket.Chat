import { Icon, SidebarV2Item, SidebarV2ItemBadge, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { SidePanelFiltersKeys } from '../../views/navigation/contexts/RoomsNavigationContext';
import { useUnreadGroupData } from '../../views/navigation/contexts/RoomsNavigationContext';
import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type SidebarFiltersItemProps = {
	title: SidePanelFiltersKeys;
	selected: boolean;
	icon: IconName;
	onClick: () => void;
};

const RoomListFiltersItem = ({ title, selected, icon, onClick }: SidebarFiltersItemProps) => {
	const { t } = useTranslation();
	const unreadGroupCount = useUnreadGroupData(title);
	const { unreadTitle, unreadVariant, showUnread, unreadCount, highlightUnread: highlighted } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarV2Item tabIndex={0} role='tab' selected={selected} onClick={onClick}>
			<Icon size='x20' name={icon} />
			<SidebarV2ItemTitle unread={highlighted}>{t(title)}</SidebarV2ItemTitle>
			{showUnread && (
				<SidebarV2ItemBadge
					variant={unreadVariant}
					title={unreadTitle}
					role='status'
					aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title })}
				>
					<span aria-hidden>{unreadCount.total}</span>
				</SidebarV2ItemBadge>
			)}
		</SidebarV2Item>
	);
};

export default memo(RoomListFiltersItem);
