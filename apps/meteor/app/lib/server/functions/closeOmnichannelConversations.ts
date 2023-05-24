import type { IUser } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { Livechat } from '../../../livechat/server/lib/LivechatTyped';
import { i18n } from '../../../../server/lib/i18n';

type SubscribedRooms = {
	rid: string;
	t: string;
};

export const closeOmnichannelConversations = async (user: IUser, subscribedRooms: SubscribedRooms[]): Promise<void> => {
	const roomsInfo = await LivechatRooms.findByIds(subscribedRooms.map(({ rid }) => rid));
	const language = settings.get<string>('Language') || 'en';
	const comment = i18n.t('Agent_deactivated', { lng: language });

	const promises: Promise<void>[] = [];
	await roomsInfo.forEach((room: any) => {
		promises.push(Livechat.closeRoom({ user, room, comment }));
	});

	await Promise.all(promises);
};
