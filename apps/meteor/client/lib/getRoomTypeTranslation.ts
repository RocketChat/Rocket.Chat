import {
	isPublicRoom,
	type IRoom,
	isDirectMessageRoom,
	isPrivateTeamRoom,
	isPublicTeamRoom,
	isPrivateDiscussion,
	isPrivateRoom,
} from '@rocket.chat/core-typings';

import { t } from '../../app/utils/lib/i18n';

export const getRoomTypeTranslation = (room: IRoom) => {
	if (isPublicRoom(room)) {
		return t('Channel');
	}

	if (isPrivateDiscussion(room)) {
		return t('Private_Discussion');
	}

	if (isPrivateRoom(room)) {
		return t('Private_Group');
	}

	if (isDirectMessageRoom(room)) {
		return t('Direct_Message');
	}

	if (isPrivateTeamRoom(room)) {
		return t('Teams_Private_Team');
	}

	if (isPublicTeamRoom(room)) {
		return t('Teams_Public_Team');
	}

	return t('Room');
};
