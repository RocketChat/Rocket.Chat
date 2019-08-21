import { Meteor } from 'meteor/meteor';

import { eventTypes } from '../../../models/server/models/FederationEvents';
import { Federation } from '../federation';

Meteor.methods({
	FEDERATION_Test_Setup() {
		try {
			Federation.client.dispatchEvent([Federation.domain], {
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
