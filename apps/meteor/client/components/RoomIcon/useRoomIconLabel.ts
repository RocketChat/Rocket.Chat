import type { UserStatus } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isOmnichannelRoom, isRoomFederated } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom, TranslationKey } from '@rocket.chat/ui-contexts';
import { useUserPresence } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

const statusLabels: Record<`${UserStatus}`, TranslationKey> = {
	online: 'Online',
	away: 'Away',
	busy: 'Busy',
	offline: 'Offline',
	disabled: 'Disabled',
};

const getDirectMessagePeerId = (room: SubscriptionWithRoom) => {
	if (!isDirectMessageRoom(room) || !room.uids || room.uids.length === 0 || room.uids.length > 2) {
		return undefined;
	}

	return room.uids.find((uid) => uid !== room.u?._id) || room.u?._id;
};

/**
 * The accessible name for the icon `RoomIcon` renders for the same room.
 */
export const useRoomIconLabel = (room: SubscriptionWithRoom, isIncomingCall?: boolean): string => {
	const { t } = useTranslation();
	const status = useUserPresence(getDirectMessagePeerId(room))?.status;

	if (isIncomingCall) {
		return t('Incoming_call');
	}

	if (isOmnichannelRoom(room)) {
		return t('Omnichannel');
	}

	if (room.abacAttributes) {
		return t('ABAC_Managed');
	}

	if (isRoomFederated(room)) {
		return t('Federated');
	}

	if (room.prid) {
		return t('Discussion');
	}

	if (room.teamMain) {
		return room.t === 'p' ? t('Private_Team') : t('Team');
	}

	if (isDirectMessageRoom(room)) {
		return status ? t(statusLabels[status]) : t('Direct_message');
	}

	return room.t === 'p' ? t('Private_Channel') : t('Public_Channel');
};
