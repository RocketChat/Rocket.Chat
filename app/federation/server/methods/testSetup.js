import { Meteor } from 'meteor/meteor';

import { eventTypes } from '../../../models/server/models/FederationEvents';
import { getFederationDomain } from '../lib/getFederationDomain';
import { dispatchEvent } from '../handler';

Meteor.methods({
	FEDERATION_Test_Setup() {
		try {
			dispatchEvent([getFederationDomain()], {
				type: eventTypes.PING,
			});

			return {
				message: 'FEDERATION_Test_Setup_Success',
			};
		} catch (err) {
			throw new Meteor.Error('FEDERATION_Test_Setup_Error');
		}
	},
});
