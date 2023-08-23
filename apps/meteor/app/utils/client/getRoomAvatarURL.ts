import type { IRoom } from '@rocket.chat/core-typings';

import { settings } from '../../settings/client';
import { getAvatarURL } from './getAvatarURL';

export const getRoomAvatarURL = ({ roomId, cache = '' }: { roomId: IRoom['_id']; cache: IRoom['avatarETag'] }) => {
	const externalSource = (settings.get('Accounts_RoomAvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource && typeof externalSource === 'string') {
		return externalSource.replace('{roomId}', roomId);
	}

	if (!roomId) {
		return;
	}

	return getAvatarURL({ roomId, cache });
};
