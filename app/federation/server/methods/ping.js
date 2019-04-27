import { Meteor } from 'meteor/meteor';
import { FederationEvents } from '../../../models';
import { settings } from '../../../settings';
import { delay } from '../PeerHTTP/utils';

export function ping(peers, timeToWait = 5000) {
	// Create the ping events
	const pingEvents = FederationEvents.ping(peers);

	// Make sure timeToWait is at least one second
	timeToWait = timeToWait < 1000 ? 1000 : timeToWait;

	const results = {};

	while (timeToWait > 0) {
		timeToWait -= 500;
		delay(500);

		for (const { _id: pingEventId } of pingEvents) {
			// Get the ping event
			const pingEvent = FederationEvents.findOne({ _id: pingEventId });

			if (!pingEvent.fulfilled && !pingEvent.error) { continue; }

			// If there is an error or the event is fulfilled, it means it is already handled.
			// Given that, fulfilled will be true if everything went well, or false if there was an error;
			results[pingEvent.peer] = pingEvent.fulfilled;
		}

		// If we already have all the results, break
		if (Object.keys(results).length === peers.length) {
			break;
		}
	}

	return results;
}

Meteor.methods({
	FEDERATION_Test_Setup() {
		const localPeer = settings.get('FEDERATION_Domain');

		const results = ping([localPeer]);

		if (!results[localPeer]) {
			throw new Meteor.Error('FEDERATION_Test_Setup_Error');
		}

		return {
			message: 'FEDERATION_Test_Setup_Success',
		};
	},
});
