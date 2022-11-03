import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils/client';
import { otrSystemMessages } from '../lib/constants';

Meteor.startup(() => {
	MessageTypes.registerType({
		id: otrSystemMessages.USER_JOINED_OTR,
		system: true,
		message: otrSystemMessages.USER_JOINED_OTR,
	});
	MessageTypes.registerType({
		id: otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
		system: true,
		message: otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
	});
	MessageTypes.registerType({
		id: otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
		system: true,
		message: otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
	});
});
