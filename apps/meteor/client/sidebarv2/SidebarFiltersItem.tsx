import { Icon, SidebarV2Item, SidebarV2ItemBadge, SidebarV2ItemTitle } from '@rocket.chat/fuselage';
import type { Keys as IconName } from '@rocket.chat/icons';
import { useTranslation } from 'react-i18next';

import { useUnreadDisplay } from './hooks/useUnreadDisplay';
import type { GroupedUnreadInfoData } from '../views/navigation/providers/RoomsNavigationProvider';

type SidebarFiltersItemProps = {
	title: string;
	selected: boolean;
	icon: IconName;
	unreadGroupCount: GroupedUnreadInfoData;
	onClick: () => void;
};

const SidebarFiltersItem = ({ title, selected, icon, unreadGroupCount, onClick }: SidebarFiltersItemProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, showUnread, unreadCount } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarV2Item is='a' selected={selected} onClick={onClick}>
			<Icon size='x20' name={icon} />
			<SidebarV2ItemTitle>{t(title)}</SidebarV2ItemTitle>
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

export default SidebarFiltersItem;
