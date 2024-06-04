import type { IRoom } from '@rocket.chat/core-typings';

import { t } from '../../app/utils/lib/i18n';

export const getRoomTypeTranslation = (type: IRoom['t']) => {
	switch (type) {
		case 'c':
			return t('Channel');
		case 'p':
			return t('Private_Group');
		case 'd':
			return t('Direct_Message');
		case 'l':
			return t('Livechat');
		default:
			return t('Room');
	}
};
