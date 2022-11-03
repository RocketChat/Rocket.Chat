import type { IncomingHttpHeaders } from 'http';

import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { sauEvents } from '../services/sauMonitor/events';
import type { ILoginAttempt } from '../../app/authentication/server/ILoginAttempt';
import { deviceManagementEvents } from '../services/device-management/events';

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

Accounts.onLogout((info: { user: Meteor.User; connection: Meteor.Connection }) => {
	const { httpHeaders } = info.connection;

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
