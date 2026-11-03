import { Presence } from '@rocket.chat/core-services';
import { trackPresence } from '@rocket.chat/ddp-server';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Meteor } from 'meteor/meteor';
import { throttle } from 'underscore';

import { lifecycle, sessions } from '../../../server/lib/realtime/sessions';

// update connections count every 30 seconds
const updateConns = throttle(function _updateConns() {
	void InstanceStatus.updateConnections(sessions.size);
}, 30000);

Meteor.startup(() => {
	const nodeId = InstanceStatus.id();

	process.on('exit', async () => {
		await Presence.removeLostConnections(nodeId);
	});

	trackPresence(lifecycle, nodeId);

	lifecycle.on('loggedIn', updateConns);
	lifecycle.on('loggedOut', updateConns);
	lifecycle.on('disconnected', updateConns);
});
