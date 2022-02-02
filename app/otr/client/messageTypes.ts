import { Meteor } from 'meteor/meteor';

import { MessageTypes } from '../../ui-utils/client';
import { otrSystemMessages } from '../lib/constants';

Meteor.startup(() => {
	MessageTypes.registerType({
		id: otrSystemMessages.USER_JOINED_OTR,
		system: true,
		message: 'user_joined_otr',
	});
	MessageTypes.registerType({
		id: otrSystemMessages.USER_REQUESTED_OTR_KEY_REFRESH,
		system: true,
		message: 'user_requested_otr_key_refresh',
	});
	MessageTypes.registerType({
		id: otrSystemMessages.USER_KEY_REFRESHED_SUCCESSFULLY,
		system: true,
		message: 'user_key_refreshed_successfully',
	});
});
