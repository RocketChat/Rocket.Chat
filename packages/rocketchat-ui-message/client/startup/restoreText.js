import { Meteor } from 'meteor/meteor';
import { RoomManager, chatMessages } from 'meteor/rocketchat:ui';


Meteor.startup(() => {
	RocketChat.callbacks.add('enter-room', () => {
		setTimeout(() => {
			if (!chatMessages[RoomManager.openedRoom].input) {
				return;
			}

			chatMessages[RoomManager.openedRoom].restoreText(RoomManager.openedRoom);

			const mediaQueryList = window.matchMedia('screen and (min-device-width: 500px)');
			if (mediaQueryList.matches) {
				chatMessages[RoomManager.openedRoom].input.focus();
			}
		}, 200);
	});
});
