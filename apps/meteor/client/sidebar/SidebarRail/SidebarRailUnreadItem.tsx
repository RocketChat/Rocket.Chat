import { Badge, NavBarItem } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useUnreadDisplay } from '../hooks/useUnreadDisplay';
import type { GroupUnreadInfo } from '../lib/unreadRooms';

type SidebarRailUnreadItemProps = Omit<ComponentProps<typeof NavBarItem>, 'title' | 'badge'> & {
	title: string;
	unreadInfo: GroupUnreadInfo;
};

const SidebarRailUnreadItem = ({ title, unreadInfo, ...props }: SidebarRailUnreadItemProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadInfo);

	return (
		<NavBarItem
			{...props}
			title={title}
			aria-label={showUnread ? t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle: title }) : title}
			badge={showUnread ? <Badge variant={unreadVariant}>{unreadCount.total > 99 ? '99+' : unreadCount.total}</Badge> : undefined}
		/>
	);
};

export default SidebarRailUnreadItem;
