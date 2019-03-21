import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import { actionLinks } from 'meteor/rocketchat:action-links';
import { Rooms } from 'meteor/rocketchat:models';
import toastr from 'toastr';

actionLinks.register('joinJitsiCall', function(message, params, instance) {
	if (Session.get('openedRoom')) {
		const rid = Session.get('openedRoom');

		const room = Rooms.findOne({ _id: rid });
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (jitsiTimeout > currentTime) {
			if (instance.tabBar.getState() !== 'opened') {
				instance.tabBar.open('video');
			} else {
				// need to ReOpen video conference with slightest delay when participants try to call each other
				instance.tabBar.close();
				setTimeout(function() {
					instance.tabBar.open('video');
				}, 10);
			}
		} else {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		}
	}
});
