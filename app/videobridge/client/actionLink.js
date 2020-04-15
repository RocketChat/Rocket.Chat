import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import { settings } from '../../settings';

import { actionLinks } from '../../action-links';
import { Rooms } from '../../models';

actionLinks.register('joinJitsiCall', function(message, params, instance) {
	if (Session.get('openedRoom')) {

		const user =  Meteor.user();
		const lng = (user && user.language) || settings.get('Language') || 'en';
		const rid = Session.get('openedRoom');
		
		const room = Rooms.findOne({ _id: rid });
		const currentTime = new Date().getTime();
		const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

		console.log(`RoomJitsiTimeout => ${room.jitsiTimeout}
					JitsiTimeout => ${jitsiTimeout}
					 currentTime => ${currentTime}`);

		if (jitsiTimeout > currentTime) {
			instance.tabBar.open('video');
		} else {
			toastr.info(TAPi18n.__('call_already_ended', { lng }));
		}
	}
});
