import { Icon } from '@rocket.chat/fuselage';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { getSubscriptionDraft } from '../../lib/utils/getSubscriptionDraft';

type RoomListItemTitleIconProps = {
	room: SubscriptionWithRoom;
};

/**
 * The small marks after a room's title in the lists: a crossed bell while the room's notifications are off, and
 * a pencil while a draft waits in it. Nothing at all otherwise.
 */
const RoomListItemTitleIcon = ({ room }: RoomListItemTitleIconProps) => {
	const { t } = useTranslation();
	const draft = getSubscriptionDraft(room);
	const muted = Boolean(room.disableNotifications);

	if (!draft && !muted) {
		return null;
	}

	return (
		<>
			{muted && <Icon name='bell-off' size='x12' title={t('Muted')} />}
			{draft && <Icon name='pencil' size='x12' title={room.draft ? t('Draft') : t('Thread_draft')} />}
		</>
	);
};

export default RoomListItemTitleIcon;
