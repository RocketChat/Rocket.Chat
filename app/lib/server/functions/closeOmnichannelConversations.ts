import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { LivechatRooms } from '../../../models/server';
import { IUser } from '../../../../definition/IUser';
import { settings } from '../../../settings/server';
import { Livechat } from '../../../livechat/server/lib/Livechat';

type SubscribedRooms = {
	rid: string;
	t: string;
}

export const closeOmnichannelConversations = (user: IUser, subscribedRooms: SubscribedRooms[]): void => {
	const roomsInfo = LivechatRooms.findByIds(subscribedRooms.map(({ rid }) => rid));
	const language = settings.get('Language') || 'en';
	roomsInfo.map((room: any) =>
		Livechat.closeRoom({ user, room, comment: TAPi18n.__('Agent_deactivated', { lng: language }) }),
	);
};
