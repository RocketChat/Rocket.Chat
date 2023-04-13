import type { IRoom } from '@rocket.chat/core-typings';

import { getAvatarURL } from './getAvatarURL';
/* This import throws a lint error because the export is behind a conditional that is treated by meteor as a runtime check.
 We can't specify client/server folder here because this function can be used by both */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { settings } from '../../settings';

export const getRoomAvatarURL = ({ roomId, cache = '' }: { roomId: IRoom['_id']; cache: IRoom['avatarETag'] }) => {
	const externalSource = (settings.get('Accounts_RoomAvatarExternalProviderUrl') || '').trim().replace(/\/$/, '');
	if (externalSource !== '') {
		return externalSource.replace('{roomId}', roomId);
	}
	if (roomId == null) {
		return;
	}

	return getAvatarURL({ roomId, cache });
};
