import { Meteor } from 'meteor/meteor';
import { RoomManager, chatMessages } from 'meteor/rocketchat:ui';


Meteor.startup(() => {
	RocketChat.callbacks.add('enter-room', () => {
		setTimeout(() => {
			if (!chatMessages[RoomManager.openedRoom].input) {
				return;
			}

			chatMessages[RoomManager.openedRoom].restoreText(RoomManager.openedRoom);
		}, 200);
	});
});
