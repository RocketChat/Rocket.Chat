import { Template } from 'meteor/templating';
import './messagePopupChannel.html';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { roomCoordinator } from '../../../../client/lib/rooms/roomCoordinator';

Template.messagePopupChannel.helpers({
	channelIcon() {
		return roomCoordinator.getIcon(this);
	},
	channelName() {
		return roomCoordinator.getRoomName(this.t, this);
	},
	federatedServerName() {
		const isOriginalFromRemoteServer = isRoomFederated(this) && this.name !== this.fname;
		if (isOriginalFromRemoteServer) {
			const serverName = this.name?.split(':')[1];
			return serverName ? `[${serverName}]` : '';
		}
	},
});
