import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../settings';
import { roomTypes } from '../../../../utils';

const redirectToDefaultChannelIfNeeded = () => {
	const needToBeRedirect = () => ['/', '/home'].includes(FlowRouter.current().path);

	Tracker.autorun((c) => {
		const firstChannelAfterLogin = settings.get('First_Channel_After_Login');

		if (!needToBeRedirect()) {
			return c.stop();
		}

		if (!firstChannelAfterLogin) {
			return c.stop();
		}

		const room = roomTypes.findRoom('c', firstChannelAfterLogin, Meteor.userId());

		if (!room) {
			return;
		}

		c.stop();
		FlowRouter.go(`/channel/${ firstChannelAfterLogin }`);
	});
};
Template.home.helpers({
	title() {
		return settings.get('Layout_Home_Title');
	},
	body() {
		//return settings.get('Layout_Home_Body');
	},
	roomType() {
		const result = roomTypes.getTypes().map((roomType) => ({
			template: roomType.customTemplate || 'roomList',
			data: {
				header: roomType.header,
				identifier: roomType.identifier,
				isCombined: roomType.isCombined,
				label: roomType.label,
			},
		}));
		return result;
	},
});

Template.home.onRendered(function() {
	redirectToDefaultChannelIfNeeded();
});
