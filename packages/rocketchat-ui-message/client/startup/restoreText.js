import { Meteor } from 'meteor/meteor';
import { RoomManager } from 'meteor/rocketchat:ui-utils';
import { chatMessages } from 'meteor/rocketchat:ui';
import { callbacks } from 'meteor/rocketchat:callbacks';
import toastr from 'toastr';
import { modal } from 'meteor/rocketchat:ui-utils';
import { FlowRouter } from 'meteor/kadira:flow-router';


Meteor.startup(() => {
	const joinToJitsiConference = function(messageId) {
		const messageJitsiButton = $(`#${ messageId } .actionLinks li span`);
		if (!messageJitsiButton.length) {
			modal.close();
			toastr.error('Some problem with connect to room');
			throw new Error('message element dont\'t find');
		}
		messageJitsiButton.click();
	};

	callbacks.add('enter-room', () => {
		setTimeout(() => {
			if (!chatMessages[RoomManager.openedRoom].input) {
				return;
			}

			chatMessages[RoomManager.openedRoom].restoreText(RoomManager.openedRoom);

			const mediaQueryList = window.matchMedia('screen and (min-device-width: 500px)');
			if (mediaQueryList.matches) {
				chatMessages[RoomManager.openedRoom].input.focus();
			}

			const isForceJitsiConnect = Boolean(parseInt(FlowRouter.current().queryParams.forceJitsiConnection));
			if (isForceJitsiConnect) {
				joinToJitsiConference(FlowRouter.current().queryParams.jitsiMessage);
			}
		}, 200);
	});
});
