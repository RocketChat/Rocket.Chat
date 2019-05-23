import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/tap:i18n';
import toastr from 'toastr';

import { actionLinks } from '../../action-links';
import { Rooms } from '../../models';

actionLinks.register('joinJitsiCall', function(message, params, instance) {
	if (Session.get('openedRoom')) {
		const rid = Session.get('openedRoom');

		const room = Rooms.findOne({ _id: rid });
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		if (jitsiTimeout > currentTime) {
			instance.tabBar.open('video');
		} else {
			toastr.info(TAPi18n.__('Call Already Ended', ''));
		}
	}
});
