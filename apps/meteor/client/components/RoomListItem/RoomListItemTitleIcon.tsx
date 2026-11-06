import { Icon, SidebarItemIcon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getSubscriptionDraft } from '../../lib/utils/getSubscriptionDraft';
import { isUnreadRoom } from '../../sidebar/lib/unreadRooms';

export type RoomListItemTitleIconProps = {
	room: SubscriptionWithRoom;
};

/**
 * The small marks after a room's title in the lists: a crossed bell while the room's notifications are off, and
 * a pencil while a draft waits in it. Nothing at all otherwise. Each mark is a labelled image that also describes
 * the row's link, so what it says reaches a screen reader as well as the eye.
 */
const RoomListItemTitleIcon = ({ room }: RoomListItemTitleIconProps) => {
	const { t } = useTranslation();
	const draft = getSubscriptionDraft(room);
	const muted = Boolean(room.disableNotifications);

	if (!draft && !muted) {
		return null;
	}

	const highlighted = isUnreadRoom(room);

	return (
		<>
			{muted && <SidebarItemIcon icon={<Icon name='bell-off' size='x12' />} label={t('Notifications_off')} highlighted={highlighted} />}
			{draft && (
				<SidebarItemIcon
					icon={<Icon name='pencil' size='x12' />}
					label={room.draft ? t('Draft') : t('Thread_draft')}
					highlighted={highlighted}
				/>
			)}
		</>
	);
};

export default RoomListItemTitleIcon;
