import type { IncomingHttpHeaders } from 'http';

import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { ILoginAttempt } from '../../app/authentication/server/ILoginAttempt';
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

	const eventObject = {
		userId: info.user._id,
		connection: {
			...info.connection,
			...(resume && { loginToken: Accounts._hashLoginToken(resume) }),
			instanceId: InstanceStatus.id(),
			httpHeaders: httpHeaders as IncomingHttpHeaders,
		},
	};
	sauEvents.emit('accounts.login', eventObject);
	deviceManagementEvents.emit('device-login', eventObject);
});

Accounts.onLogout((info) => {
	const { httpHeaders } = info.connection;

	if (!info.user) {
		return;
	}
	sauEvents.emit('accounts.logout', {
		userId: info.user._id,
		connection: { instanceId: InstanceStatus.id(), ...info.connection, httpHeaders: httpHeaders as IncomingHttpHeaders },
	});
});

Meteor.onConnection((connection) => {
	connection.onClose(async () => {
		const { httpHeaders } = connection;
		sauEvents.emit('socket.disconnected', {
			instanceId: InstanceStatus.id(),
			...connection,
			httpHeaders: httpHeaders as IncomingHttpHeaders,
		});
	});
});

Meteor.onConnection((connection) => {
	const { httpHeaders } = connection;

	sauEvents.emit('socket.connected', { instanceId: InstanceStatus.id(), ...connection, httpHeaders: httpHeaders as IncomingHttpHeaders });
});
