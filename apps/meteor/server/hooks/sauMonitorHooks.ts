import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { ILoginAttempt } from '../../app/authentication/server/ILoginAttempt';
import { getClientAddress } from '../lib/getClientAddress';
import { getHeader } from '../lib/getHeader';
import { deviceManagementEvents } from '../services/device-management/events';
import { sauEvents } from '../services/sauMonitor/events';

Accounts.onLogin((info: ILoginAttempt) => {
	const {
		methodArguments,
		connection: { httpHeaders },
	} = info;

	if (!info.user) {
		return;
	}

	const { resume } = methodArguments.find((arg) => 'resume' in arg) ?? {};
	const loginToken = resume ? Accounts._hashLoginToken(resume) : '';
	const instanceId = InstanceStatus.id();
	const clientAddress = getClientAddress(info.connection);
	const userAgent = getHeader(httpHeaders, 'user-agent');
	const host = getHeader(httpHeaders, 'host');

	sauEvents.emit('sau.accounts.login', {
		userId: info.user._id,
		instanceId,
		userAgent,
		loginToken,
		connectionId: info.connection.id,
		clientAddress,
		host,
	});

	deviceManagementEvents.emit('device-login', { userId: info.user._id, userAgent, loginToken, clientAddress });
});

Accounts.onLogout((info) => {
	if (!info.user) {
		return;
	}

	sauEvents.emit('sau.accounts.logout', { userId: info.user._id, sessionId: info.connection.id });
});

Meteor.onConnection((connection) => {
	connection.onClose(async () => {
		sauEvents.emit('sau.socket.disconnected', { connectionId: connection.id, instanceId: InstanceStatus.id() });
	});
});

Meteor.onConnection((connection) => {
	// in case of implementing a listener of this event, define the parameters type in services/sauMonitor/events.ts
	sauEvents.emit('sau.socket.connected', { instanceId: InstanceStatus.id(), connectionId: connection.id });
});
