import { test } from '../../utils/test';

const testToBeImplemented = () => undefined;

test.describe.parallel('Federation - XMPP', () => {
	test.describe('Configuration', () => {
		test.skip('expect to register the XMPP bridge with the Rocket.Chat Service API', testToBeImplemented);
		test.skip('expect to configure exclusive XMPP user and room alias namespaces', testToBeImplemented);
		test.skip('expect to enable XMPP bridge settings when federation service is enabled', testToBeImplemented);
		test.skip('expect to save the XMPP bridge URL, homeserver token, and appservice token', testToBeImplemented);
		test.skip('expect to apply XMPP bridge configuration after federation settings change', testToBeImplemented);
	});

	test.describe('Join rooms', () => {
		test.skip('expect to expose the /xmpp slash command with the XMPP room alias parameter', testToBeImplemented);
		test.skip('expect to join an external XMPP room using /xmpp from a local user', testToBeImplemented);
		test.skip('expect to reject /xmpp when no XMPP room alias is provided', testToBeImplemented);
		test.skip('expect to create a Rocket.Chat channel for the joined XMPP room', testToBeImplemented);
		test.skip('expect to reuse the existing Rocket.Chat channel when joining the same XMPP room again', testToBeImplemented);
		test.skip('expect two local users joining the same XMPP room to share the same Rocket.Chat channel', testToBeImplemented);
		test.skip('expect to sanitize XMPP room aliases into valid Rocket.Chat channel names', testToBeImplemented);
		test.skip('expect to synchronize XMPP room history into the Rocket.Chat channel', testToBeImplemented);
		test.skip('expect to prevent a native federated user from joining an XMPP room', testToBeImplemented);
		test.skip('expect to show a failure when the XMPP bridge rejects the room join', testToBeImplemented);
	});

	test.describe('Messaging', () => {
		test.skip('expect to send a message from Rocket.Chat to an XMPP room', testToBeImplemented);
		test.skip('expect to receive a message from an XMPP participant in Rocket.Chat', testToBeImplemented);
		test.skip('expect to render XMPP participant messages with the correct sender display name', testToBeImplemented);
		test.skip('expect to mention an XMPP participant using the mapped Rocket.Chat identity', testToBeImplemented);
		test.skip('expect the XMPP bridge to notify Rocket.Chat immediately when message delivery acknowledgement fails', testToBeImplemented);
		test.skip('expect to show an alert when XMPP message delivery acknowledgement fails', testToBeImplemented);
	});

	test.describe('Membership and identity', () => {
		test.skip('expect to create local federated users for XMPP participants', testToBeImplemented);
		test.skip('expect to list XMPP participants in the room members list', testToBeImplemented);
		test.skip('expect to handle XMPP participant joins and leaves in the room timeline', testToBeImplemented);
		test.skip('expect to update the mapped Rocket.Chat user when an XMPP participant display name changes', testToBeImplemented);
		test.skip('expect to render XMPP participant avatars from remote avatar data', testToBeImplemented);
	});

	test.describe('Namespace security', () => {
		test.skip('expect to reserve the _xmpp_ namespace for federated identities', testToBeImplemented);
		test.skip('expect to reject XMPP appservice user registration outside the reserved _xmpp_ namespace', testToBeImplemented);
		test.skip('expect to reject local user creation using the reserved _xmpp_ namespace', testToBeImplemented);
		test.skip('expect to display the reserved XMPP namespace error message when local user creation is rejected', testToBeImplemented);
	});
});
