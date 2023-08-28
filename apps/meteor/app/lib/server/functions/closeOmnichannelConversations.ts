import type { IUser } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { Livechat } from '../../../livechat/server/lib/LivechatTyped';
import { settings } from '../../../settings/server';

type SubscribedRooms = {
	rid: string;
	t: string;
};

export const closeOmnichannelConversations = async (user: IUser, subscribedRooms: SubscribedRooms[]): Promise<void> => {
	const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
	const roomsInfo = await LivechatRooms.findByIds(
		subscribedRooms.map(({ rid }) => rid),
		{},
		extraQuery,
	);
	const language = settings.get<string>('Language') || 'en';
	const comment = i18n.t('Agent_deactivated', { lng: language });

	const promises: Promise<void>[] = [];
	await roomsInfo.forEach((room: any) => {
		promises.push(Livechat.closeRoom({ user, room, comment }));
	});

	await Promise.all(promises);
};
