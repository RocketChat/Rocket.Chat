import { SidebarV2ItemBadge } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useUnreadDisplay } from '../hooks/useUnreadDisplay';

type RoomListFiltersItemBadgeProps = {
	roomTitle: TranslationKey;
	unreadGroupCount: Pick<
		SubscriptionWithRoom,
		'alert' | 'userMentions' | 'unread' | 'tunread' | 'tunreadUser' | 'groupMentions' | 'hideMentionStatus' | 'hideUnreadStatus'
	>;
};

/**
 * TODO: This component can be optimized and used in multiple places.
 * The usage of the <span> to handle properly the aria label together with the
 * unread number could be moved to fuselage
 **/

const RoomListFiltersItemBadge = ({ roomTitle, unreadGroupCount }: RoomListFiltersItemBadgeProps) => {
	const { t } = useTranslation();
	const { unreadTitle, unreadVariant, unreadCount } = useUnreadDisplay(unreadGroupCount);

	return (
		<SidebarV2ItemBadge
			variant={unreadVariant}
			title={unreadTitle}
			role='status'
			aria-label={t('__unreadTitle__from__roomTitle__', { unreadTitle, roomTitle })}
		>
			<span aria-hidden>{unreadCount.total}</span>
		</SidebarV2ItemBadge>
	);
};

export default RoomListFiltersItemBadge;
