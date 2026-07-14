import type { IUser } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { closeRoom } from '../../../app/livechat/server/lib/closeRoom';
import { settings } from '../../../app/settings/server';
import { callbacks } from '../callbacks';
import { i18n } from '../i18n';

type SubscribedRooms = {
	rid: string;
	t: string;
};

export const closeOmnichannelConversations = async (
	user: IUser,
	subscribedRooms: SubscribedRooms[],
	executedBy?: string,
): Promise<void> => {
	const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: executedBy });
	const roomsInfo = LivechatRooms.findByIds(
		subscribedRooms.map(({ rid }) => rid),
		{},
		extraQuery,
	);
	const language = settings.get<string>('Language') || 'en';
	const comment = i18n.t('Agent_deactivated', { lng: language });

	const promises: Promise<void>[] = [];
	await roomsInfo.forEach((room) => {
		promises.push(closeRoom({ user, room, comment }));
	});

	await Promise.all(promises);
};
