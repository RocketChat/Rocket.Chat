import type { IncomingHttpHeaders } from 'http';

import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import { sauEvents } from '../services/sauMonitor/events';
import { ILoginAttempt } from '../../app/authentication/server/ILoginAttempt';

Accounts.onLogin((info: ILoginAttempt) => {
	const {
		methodArguments,
		connection: { httpHeaders },
		user: { _id },
	} = info;

	const { resume } = methodArguments.find((arg) => 'resume' in arg) ?? {};

	const loginToken = resume ? Accounts._hashLoginToken(resume) : '';

	sauEvents.emit('accounts.login', {
		userId: _id,
		connection: {
			...info.connection,
			loginToken,
			instanceId: InstanceStatus.id(),
			httpHeaders,
		},
	});
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
