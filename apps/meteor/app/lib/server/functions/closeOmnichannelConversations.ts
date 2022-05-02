import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IUser } from '@rocket.chat/core-typings';

import { LivechatRooms } from '../../../models/server';
import { settings } from '../../../settings/server';
import { Livechat } from '../../../livechat/server/lib/Livechat';

type SubscribedRooms = {
	rid: string;
	t: string;
};

export const closeOmnichannelConversations = (user: IUser, subscribedRooms: SubscribedRooms[]): void => {
	const roomsInfo = LivechatRooms.findByIds(subscribedRooms.map(({ rid }) => rid));
	const language = settings.get<string>('Language') || 'en';
	const comment = TAPi18n.__('Agent_deactivated', { lng: language });
	roomsInfo.forEach((room: any) => {
		Livechat.closeRoom({ user, visitor: {}, room, comment });
	});
};
