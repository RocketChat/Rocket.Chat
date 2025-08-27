import { MessageTypes } from '@rocket.chat/message-types';
import { Meteor } from 'meteor/meteor';

import { otrSystemMessages } from '../lib/constants';

Meteor.startup(() => {
	MessageTypes.registerType({
		id: otrSystemMessages.USER_JOINED_OTR,
		system: true,
		text: (t) => t(otrSystemMessages.USER_JOINED_OTR),
	});
	MessageTypes.registerType({
		id: otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
		system: true,
		text: (t) => t(otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH),
	});
	MessageTypes.registerType({
		id: otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
		system: true,
		text: (t) => t(otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY),
	});
});
