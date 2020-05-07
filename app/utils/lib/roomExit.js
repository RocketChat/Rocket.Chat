import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';

import { callbacks } from '../../callbacks';

export const roomExit = function() {
	if (Meteor.isServer) {
		return;
	}

	const { RoomManager } = require('../../ui-utils/client');
	// 7370 - Close flex-tab when opening a room on mobile UI
	if (window.matchMedia('(max-width: 500px)').matches) {
		const flex = document.querySelector('.flex-tab');
		if (flex) {
			const templateData = Blaze.getData(flex);
			templateData && templateData.tabBar && templateData.tabBar.close();
		}
	}

	callbacks.run('roomExit');

	if (typeof window.currentTracker !== 'undefined') {
		window.currentTracker.stop();
	}

	const wrapper = document.querySelector(`#chat-window-${ RoomManager.openedRoom } .messages-box > .wrapper`);

	if (!wrapper) {
		return;
	}
	RoomManager.room.oldScrollTop = wrapper.scrollTop;
};
