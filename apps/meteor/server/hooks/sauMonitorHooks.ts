import type { IncomingHttpHeaders } from 'http';

import type { LoginSessionPayload, LogoutSessionPayload, DeviceLoginPayload } from '@rocket.chat/core-typings';
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
	const userId = info.user._id;
	const connectionId = info.connection.id;
	const clientAddress = getClientAddress(info.connection);
	const userAgent = getHeader(httpHeaders, 'user-agent');
	const host = getHeader(httpHeaders, 'host');

	const loginEventObject: LoginSessionPayload = {
		userId,
		instanceId,
		userAgent,
		loginToken,
		connectionId,
		clientAddress,
		host,
	};
	sauEvents.emit('sau.accounts.login', loginEventObject);

	const deviceLoginEventObject: DeviceLoginPayload = {
		userId,
		userAgent,
		loginToken,
		clientAddress,
	};
	deviceManagementEvents.emit('device-login', deviceLoginEventObject);
});

Accounts.onLogout((info) => {
	if (!info.user) {
		return;
	}

	const logoutEventObject: LogoutSessionPayload = {
		userId: info.user._id,
		sessionId: info.connection.id,
	};

	sauEvents.emit('sau.accounts.logout', logoutEventObject);
});

Meteor.onConnection((connection) => {
	connection.onClose(async () => {
		const { httpHeaders } = connection;
		sauEvents.emit('sau.socket.disconnected', {
			instanceId: InstanceStatus.id(),
			...connection,
			httpHeaders: httpHeaders as IncomingHttpHeaders,
		});
	});
});

Meteor.onConnection((connection) => {
	const { httpHeaders } = connection;
	sauEvents.emit('sau.socket.connected', {
		instanceId: InstanceStatus.id(),
		...connection,
		httpHeaders: httpHeaders as IncomingHttpHeaders,
	});
});
